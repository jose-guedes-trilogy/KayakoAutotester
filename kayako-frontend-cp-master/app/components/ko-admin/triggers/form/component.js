import { gt } from '@ember/object/computed';
import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import EmberObject from '@ember/object';
import { attr, many, model, isEdited } from 'frontend-cp/services/virtual-model';
import diffAttrs from 'ember-diff-attrs';

const schema = model('trigger', {
  id: attr(),
  title: attr(),
  executionOrder: attr(),
  channel: attr(),
  event: attr(),
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
  isEnabled: attr(),
  createdAt: attr(),
  updatedAt: attr()
});

export default Component.extend({
  // Attributes
  theTrigger: null,
  channels: null,
  definitions: null,
  registerAs: () => {},
  didSave: () => {},
  cancel: () => {},

  // Services
  virtualModel: service(),
  confirmation: service(),

  // Lifecycle hooks
  init() {
    this._super(...arguments);
    this.get('registerAs')(this);
  },

  didReceiveAttrs: diffAttrs('theTrigger', function(changedAttrs, ...args) {
    this._super(...args);
    if (!changedAttrs || changedAttrs.theTrigger) {
      this.initEdits();
    }
  }),

  // CP's
  channelList: computed('channels.[]', function() {
    let channels = this.get('channels').toArray();
    let any = EmberObject.create({ id: null });
    return [any, ...channels];
  }),

  selectedChannelEvents: computed('editedTrigger.channel', function() {
    let currentlySelectedChannel = this.get('channels').find((channel) => {
      return channel.get('id') === this.get('editedTrigger.channel');
    });

    if (!currentlySelectedChannel) {
      return [];
    }

    let events = currentlySelectedChannel.get('events').toArray().map(id => {
      return EmberObject.create({ id });
    });

    let any = EmberObject.create({ id: null });
    return [any, ...events];
  }),

  channelHasMultipleEvents: gt('selectedChannelEvents.length', 1),

  filteredDefinitions: computed('definitions', 'editedTrigger.channel', function() {
    let definitions = this.get('definitions');
    let channel = this.get('editedTrigger.channel');
    let channelsToFilter = [
      'TWITTER',
      'MAIL',
      'FACEBOOK',
      'SYSTEM',
      'MESSENGER',
      'API'
    ];

    definitions.forEach((definition) => {
      if (definition.get('group') === channel || !channelsToFilter.includes(definition.get('group'))) {
        definition.set('disabled', false);
      } else {
        definition.set('disabled', true);
      }
    });

    return definitions;
  }),

  canBeDeleted: computed('theTrigger.isNew', function() {
    return !this.get('theTrigger.isNew');
  }),

  // Actions
  actions: {
    setChannel(channel) {
      this.set('editedTrigger.channel', channel.get('id'));
      this.set('editedTrigger.event', null);
    },

    setEvent(event) {
      this.set('editedTrigger.event', event.get('id'));
    },

    addCollection() {
      this.get('editedTrigger.predicateCollections').pushObject({
        propositions: [{}]
      });
    },

    removeCollection(predicateCollection) {
      this.get('editedTrigger.predicateCollections').removeObject(predicateCollection);
    },

    addPropositionToCollection(predicateCollection) {
      get(predicateCollection, 'propositions').pushObject({});
    },

    removePropositionFromCollection(predicateCollection, proposition) {
      get(predicateCollection, 'propositions').removeObject(proposition);
    },

    addAction() {
      this.get('editedTrigger.actions').pushObject({});
    },

    removeAction(action) {
      this.get('editedTrigger.actions').removeObject(action);
    },

    save() {
      let trigger = this.get('theTrigger');
      let editedTrigger = this.get('editedTrigger');

      return this.get('virtualModel').save(trigger, editedTrigger, schema)
        .then(() => {
          trigger.get('predicateCollections').toArray().forEach(predColl => {
            if (predColl.get('isNew')) {
              predColl.get('propositions').invoke('unloadRecord');
              predColl.unloadRecord();
            } else {
              predColl.get('propositions').filterBy('isNew').invoke('unloadRecord');
            }
          });
          trigger.get('actions').filterBy('isNew').invoke('unloadRecord');
          this.set('editedTrigger', this.get('virtualModel').makeSnapshot(this.get('theTrigger'), schema));
        })
        .then(this.get('didSave'));
    },

    deleteTrigger() {
      return this.get('confirmation').confirm({
        intlConfirmationBody: 'admin.triggers.labels.delete_confirmation',
        intlConfirmationHeader: 'admin.triggers.labels.confirm_delete',
        intlConfirmLabel: 'generic.confirm.delete_button'
      }).then(() => this.get('theTrigger').destroyRecord().then(() => this.attrs.didSave()));
    }
  },

  // Methods
  initEdits() {
    this.set('editedTrigger', this.get('virtualModel').makeSnapshot(this.get('theTrigger'), schema));
  },

  isEdited() {
    return isEdited(this.get('theTrigger'), this.get('editedTrigger'), schema);
  }
});
