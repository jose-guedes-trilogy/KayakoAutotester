import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { attr, many, model, isEdited } from 'frontend-cp/services/virtual-model';
import diffAttrs from 'ember-diff-attrs';

const schema = model('monitor', {
  id: attr(),
  title: attr(),
  executionOrder: attr(),
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
  store: service(),
  virtualModel: service(),
  confirmation: service(),

  // Lifecycle hooks
  init() {
    this._super(...arguments);
    this.get('registerAs')(this);
  },

  didReceiveAttrs: diffAttrs('monitor', function(changedAttrs, ...args) {
    this._super(...args);
    if (!changedAttrs || changedAttrs.monitor) {
      this.initEdits();
    }
  }),

  canBeDeleted: computed('monitor.isNew', function() {
    return !this.get('monitor.isNew');
  }),

  // Actions
  actions: {
    addCollection() {
      this.get('editedMonitor.predicateCollections').pushObject({
        propositions: [{}]
      });
    },

    removeCollection(predicateCollection) {
      this.get('editedMonitor.predicateCollections').removeObject(predicateCollection);
    },

    addPropositionToCollection(predicateCollection) {
      get(predicateCollection, 'propositions').pushObject({});
    },

    removePropositionFromCollection(predicateCollection, proposition) {
      get(predicateCollection, 'propositions').removeObject(proposition);
    },

    addAction() {
      this.get('editedMonitor.actions').pushObject({});
    },

    removeAction(action) {
      this.get('editedMonitor.actions').removeObject(action);
    },

    save() {
      const monitor = this.get('monitor');
      const editedMonitor = this.get('editedMonitor');
      return this.get('virtualModel').save(monitor, editedMonitor, schema)
        .then(() => {
          monitor.get('predicateCollections').toArray().forEach(predColl => {
            if (predColl.get('isNew')) {
              predColl.get('propositions').invoke('unloadRecord');
              predColl.unloadRecord();
            } else {
              predColl.get('propositions').filterBy('isNew').invoke('unloadRecord');
            }
          });
          monitor.get('actions').filterBy('isNew').invoke('unloadRecord');
          this.set('editedMonitor', this.get('virtualModel').makeSnapshot(this.get('monitor'), schema));
        })
        .then(this.get('didSave'));
    },

    deleteMonitor() {
      return this.get('confirmation').confirm({
        intlConfirmationBody: 'admin.monitors.labels.delete_confirmation',
        intlConfirmationHeader: 'admin.monitors.labels.confirm_delete',
        intlConfirmLabel: 'generic.confirm.delete_button'
      }).then(() => this.get('monitor').destroyRecord().then(() => this.attrs.didSave()));
    }
  },

  // Methods
  initEdits() {
    this.set('editedMonitor', this.get('virtualModel').makeSnapshot(this.get('monitor'), schema));
  },

  isEdited() {
    return isEdited(this.get('monitor'), this.get('editedMonitor'), schema);
  }
});
