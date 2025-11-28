import { attr, many, model, isEdited } from 'frontend-cp/services/virtual-model';
import fallbackIfUndefined from 'ember-basic-dropdown/utils/computed-fallback-if-undefined';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { get } from '@ember/object';
import { set } from '@ember/object';
import { inject as service } from '@ember/service';
import diffAttrs from 'ember-diff-attrs';
import { setProperties } from '@ember/object';

const schema = model('visitor-engagement', {
  id: attr(),
  title: attr(),
  executionOrder: attr(),
  isEnabled: attr(),
  predicateCollections: many(model('predicate-collection', {
    id: attr(),
    propositions: many(model('proposition', {
      id: attr(),
      field: attr(),
      operator: attr(),
      value: attr()
    }))
  })),
  actions: many(model('automation-action', {
    label: attr(),
    name: attr(),
    option: attr(),
    value: attr(),
    attributes: attr()
  })),
  createdAt: attr(),
  updatedAt: attr()
});

export default Component.extend({
  // Attributes
  theVisitorEngagement: null,
  definitions: null,
  timeBasedCollection: null,
  teams: fallbackIfUndefined([]),
  agents: fallbackIfUndefined([]),
  registerAs: () => {},
  didSave: () => {},
  cancel: () => {},

  // Services
  virtualModel: service(),
  confirmation: service(),
  store: service(),

  // Lifecycle hooks
  init() {
    this._super(...arguments);
    this.registerAs(this);
  },

  didReceiveAttrs: diffAttrs('theVisitorEngagement', function(changedAttrs, ...args) {
    this._super(...arguments);
    if (changedAttrs && !changedAttrs.theVisitorEngagement) {
      return;
    }

    if (!changedAttrs) {
      const actions = this.get('theVisitorEngagement.actions').toArray();
      if((actions.length === 1 && !get(actions[0], 'name'))) {
        setProperties(actions[0], {
          name: 'send_message',
          option: null,
          value: null,
          attributes: {}
        });
      }
    }

    this.initEdits();

    /**
     * This code populates timeBasedPropositions if there is no timeBasedCollection present.
     * Also it is decided here if 'Add a new condition' button inside collections should be shown or not
     */
    let isTimeBasedPropositionPresent = false;
    this.get('editedVisitorEngagement.predicateCollections').toArray().forEach((predicateCollection, index) => {
      if(get(predicateCollection, 'propositions').toArray().some((proposition) => proposition.field === 'time_on_page') || get(predicateCollection, 'propositions').toArray().some((proposition) => proposition.field === 'time_on_site')) {
        isTimeBasedPropositionPresent = true;
        this.set('timeBasedCollection', predicateCollection);
        set(this.get('editedVisitorEngagement.predicateCollections')[index], 'showAddNewCondition', false);
        return;
      }
      set(this.get('editedVisitorEngagement.predicateCollections')[index], 'showAddNewCondition', true);
    });

    this.get('editedVisitorEngagement.predicateCollections').toArray().forEach((predicateCollection, index) => {
      const definitions = this.get('store').peekAll('definition').filterBy('group', 'ENGAGEMENT');

      if(isTimeBasedPropositionPresent && predicateCollection !== this.get('timeBasedCollection')) {
        definitions.removeObject(this.getDefinition('time_on_page'));
        definitions.removeObject(this.getDefinition('time_on_site'));
      }

      if(get(predicateCollection, 'propositions').toArray().length > 1) {
        definitions.removeObject(this.getDefinition('time_on_page'));
        definitions.removeObject(this.getDefinition('time_on_site'));
      }

      set(predicateCollection, 'definitions', definitions);
    });
  }),

  // CPs
  canBeDeleted: computed.not('theVisitorEngagement.isNew'),

  // Actions
  actions: {
    save() {
      let theVisitorEngagement = this.get('theVisitorEngagement');
      let editedVisitorEngagement = this.get('editedVisitorEngagement');

      return this.get('virtualModel').save(theVisitorEngagement, editedVisitorEngagement, schema)
        .then(() => {
          theVisitorEngagement.get('predicateCollections').toArray().forEach(predColl => {
            if (predColl.get('isNew')) {
              predColl.get('propositions').invoke('unloadRecord');
              predColl.unloadRecord();
            } else {
              predColl.get('propositions').filterBy('isNew').invoke('unloadRecord');
            }
          });
          theVisitorEngagement.get('actions').filterBy('isNew').invoke('unloadRecord');
          this.set('editedVisitorEngagement', this.get('virtualModel').makeSnapshot(this.get('theVisitorEngagement'), schema));
        })
        .then(this.get('didSave'));
    },
    deleteVisitorEngagement() {
      return this.get('confirmation').confirm({
        intlConfirmationBody: 'admin.engagements.labels.delete_confirmation',
        intlConfirmationHeader: 'admin.engagements.labels.confirm_delete',
        intlConfirmLabel: 'generic.confirm.delete_button'
      })
      .then(() => this.get('theVisitorEngagement').destroyRecord()
      .then(() => this.attrs.didSave()));
    },
    addCollection() {
      const definitions = this.get('store')
        .peekAll('definition')
        .filterBy('group', 'ENGAGEMENT');
        // .filter(definition => { return definition.get('group') === 'ENGAGEMENT'; });
      const timeOnPageDefinition = this.getDefinition('time_on_page');
      const timeOnSiteDefinition = this.getDefinition('time_on_site');

      /**
       * If timeBasedCollection is there then remove both timeBasedPropositions
       */

      if (this.get('timeBasedCollection')) {
        definitions.removeObject(timeOnPageDefinition);
        definitions.removeObject(timeOnSiteDefinition);
      }

      this.get('editedVisitorEngagement.predicateCollections').pushObject({
        propositions: [{}],
        showAddNewCondition: true,
        definitions
      });
    },
    removeCollection(predicateCollection) {
      if(predicateCollection  === this.get('timeBasedCollection')) {
        this.populateTimeBasedDefinitions(predicateCollection);
      }
      this.get('editedVisitorEngagement.predicateCollections').removeObject(predicateCollection);
    },
    addPropositionToCollection(predicateCollection) {
      const collectionDefinitions = get(predicateCollection, 'definitions');
      get(predicateCollection, 'propositions').pushObject({});
      if(get(predicateCollection, 'propositions').length > 1) {
        const timeOnPageDefinition = this.getDefinition('time_on_page');
        const timeOnSiteDefinition = this.getDefinition('time_on_site');
        collectionDefinitions.removeObject(timeOnPageDefinition);
        collectionDefinitions.removeObject(timeOnSiteDefinition);
      }
    },
    removePropositionFromCollection(predicateCollection, proposition) {
      const collectionDefinitions = get(predicateCollection, 'definitions');
      const collectionPropositions = get(predicateCollection, 'propositions');
      get(predicateCollection, 'propositions').removeObject(proposition);

      /**
       * If length of predicateCollection becomes 1 after removing proposition
       * and there is no timeBasedCollection present then populate timeBasedDefinitions
       * in this collection
       */

      if(collectionPropositions.toArray().length === 1 && !this.get('timeBasedCollection')) {
        const timeOnPageDefinition = this.getDefinition('time_on_page');
        const timeOnSiteDefinition = this.getDefinition('time_on_site');
        const isTimeOnPageDefinitionPresent = collectionDefinitions.any(definition => {
          return get(definition, 'id') === 'time_on_page';
        });
        const isTimeOnSiteDefinitionPresent = collectionDefinitions.any(definition => {
          return get(definition, 'id') === 'time_on_site';
        });
        if(!isTimeOnPageDefinitionPresent) {
          collectionDefinitions.pushObject(timeOnPageDefinition);
        }
        if(!isTimeOnSiteDefinitionPresent) {
          collectionDefinitions.pushObject(timeOnSiteDefinition);
        }
      }
    },
    onPropositionChange(collection, proposition) {
      if(get(proposition, 'field') === 'time_on_page' || get(proposition, 'field') === 'time_on_site') {
        set(collection, 'showAddNewCondition', false);
        this.set('timeBasedCollection', collection);
        this.removeTimeBasedPropositionsFromAllCollections();
      } else {
        set(collection, 'showAddNewCondition', true);
        this.populateTimeBasedDefinitions(collection);
      }
    }
  },

  // Methods
  initEdits() {
    this.set('editedVisitorEngagement', this.get('virtualModel').makeSnapshot(this.get('theVisitorEngagement'), schema));
  },

  isEdited() {
    return isEdited(this.get('theVisitorEngagement'), this.get('editedVisitorEngagement'), schema);
  },

  populateTimeBasedDefinitions(collection) {
    /**
     * Populate time based propositions to those elements which are of length 1
     */
    if(collection !== this.get('timeBasedCollection')) {
      return;
    }
    const timeOnPageDefinition = this.getDefinition('time_on_page');
    const timeOnSiteDefinition = this.getDefinition('time_on_site');

    this.get('editedVisitorEngagement.predicateCollections').forEach(predicateCollection => {
      const collectionDefinitions = get(predicateCollection, 'definitions');
      if(collection !== predicateCollection && get(predicateCollection, 'propositions').length === 1) {
        const isTimeOnPageDefinitionPresent = collectionDefinitions.any(definition => {
          return get(definition, 'id') === 'time_on_page';
        });
        const isTimeOnSiteDefinitionPresent = collectionDefinitions.any(definition => {
          return get(definition, 'id') === 'time_on_site';
        });
        if(!isTimeOnPageDefinitionPresent) {
          collectionDefinitions.pushObject(timeOnPageDefinition);
        }
        if(!isTimeOnSiteDefinitionPresent) {
          collectionDefinitions.pushObject(timeOnSiteDefinition);
        }
      }
    });
    this.set('timeBasedCollection', null);
  },
  removeTimeBasedPropositionsFromAllCollections() {
    /**
     * Remove time based propositions from all collections except the one having them
     */
    const timeOnPageDefinition = this.getDefinition('time_on_page');
    const timeOnSiteDefinition = this.getDefinition('time_on_site');
    const timeBasedCollection = this.get('timeBasedCollection');
    this.get('editedVisitorEngagement.predicateCollections').forEach(predicateCollection => {
      if(timeBasedCollection !== predicateCollection) {
        get(predicateCollection, 'definitions').removeObject(timeOnPageDefinition);
        get(predicateCollection, 'definitions').removeObject(timeOnSiteDefinition);
      }
    });
  },
  getDefinition(definitionId) {
    const definitions = this.get('store')
        .peekAll('definition')
        .filterBy('group', 'ENGAGEMENT');
    return definitions.findBy('id', definitionId);
  }
});
