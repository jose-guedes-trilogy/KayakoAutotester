import $ from 'jquery';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import EmberObject, { computed } from '@ember/object';
import { attr, many, model, isEdited } from 'frontend-cp/services/virtual-model';
import propositionStyles from 'frontend-cp/components/ko-admin/predicate-builder/proposition/styles';
import predicateBuilderStyles from 'frontend-cp/components/ko-admin/predicate-builder/styles';
import diffAttrs from 'ember-diff-attrs';

const schema = model('sla', {
  id: attr(),
  title: attr(),
  description: attr(),
  executionOrder: attr(),
  predicateCollections: many(model('predicate-collection', {
    propositions: many(model('proposition', {
      field: attr(),
      operator: attr(),
      value: attr()
    }))
  })),
  targets: many(model('sla-target', {
    id: attr(),
    priority: attr(),
    slaTargetType: attr(),
    goalInSeconds: attr(),
    operationalHours: attr()
  })),
  isEnabled: attr(),
  isDeleted: attr(),
  createdAt: attr(),
  updatedAt: attr()
});

export default Component.extend({
  // Attributes
  sla: null,
  onCancel: null,
  onSuccess: null,
  definitions: [],
  priorities: [],

  // State
  editedSla: null,

  // Services
  store: service(),
  virtualModel: service(),
  confirmation: service(),

  // Lifecycle hooks
  init() {
    this._super(...arguments);
    this.get('registerAs')(this);
  },

  didReceiveAttrs: diffAttrs('sla', function(changedAttrs, ...args) {
    this._super(...args);
    if (!changedAttrs || changedAttrs.sla) {
      this.initEdits();
    }
  }),

  // CPs
  canBeDeleted: computed('sla.isNew', function() {
    return !this.get('sla.isNew');
  }),

  // Actions
  actions: {
    save() {
      const sla = this.get('sla');
      const editedSla = this.get('editedSla');
      return this.get('virtualModel').save(sla, editedSla, schema)
      .then(() => {
        sla.get('predicateCollections')
          .filter(collection => !collection.get('id'))
          .forEach(collection => collection.unloadRecord());
        sla.get('targets')
          .filter(target => !target.get('id'))
          .forEach(target => target.unloadRecord());
        this.set('editedSla', this.get('virtualModel').makeSnapshot(this.get('sla'), schema));
      });
    },

    deleteSLA() {
      return this.get('confirmation').confirm({
        intlConfirmationBody: 'admin.sla.labels.delete_confirmation',
        intlConfirmationHeader: 'admin.sla.labels.confirm_delete',
        intlConfirmLabel: 'generic.confirm.delete_button'
      }).then(() => this.get('sla').destroyRecord().then(() => this.attrs.onSuccess()));
    },

    addCollection() {
      this.get('editedSla.predicateCollections').pushObject(EmberObject.create({
        operator: 'OR',
        propositions: [EmberObject.create()]
      }));
    },

    removeCollection(collection, id) {
      const element = $('#' + id);
      element.addClass(predicateBuilderStyles.containerRemoving);
      element.fadeTo(400, 0, () => {
        this.get('editedSla.predicateCollections').removeObject(collection);
      });
    },

    createPropositionForCollection(collection) {
      collection.get('propositions').pushObject(EmberObject.create());
    },

    removePropositionFromCollection(collection, proposition, id) {
      const element = $('#' + id);
      element.addClass(propositionStyles.containerRemoving);
      element.fadeTo(400, 0, () => {
        collection.get('propositions').removeObject(proposition);
      });
    }
  },

  // Methods
  initEdits() {
    this.set('editedSla', this.get('virtualModel').makeSnapshot(this.get('sla'), schema));
  },

  isEdited() {
    return isEdited(this.get('sla'), this.get('editedSla'), schema);
  }
});
