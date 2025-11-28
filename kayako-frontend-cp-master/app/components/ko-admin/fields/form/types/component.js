import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { observer, computed } from '@ember/object';
import { task } from 'ember-concurrency';
import { attr, isEdited, model } from 'frontend-cp/services/virtual-model';

import { variation } from 'ember-launch-darkly';

const schema = model('case-type', {
  label: attr()
});

export default Component.extend({
  // HTML
  tagName: '',

  // Attributes
  types: [],
  onEditedChange: () => {},

  // State
  originalType: null,
  editedType: null,

  // Services
  confirmation: service(),
  plan: service(),
  virtualModel: service(),
  metrics: service(),

  // CPs
  systemTypes: computed('types.[]', function() {
    return this.get('types').rejectBy('caseTypeType', 'CUSTOM');
  }),

  customTypes: computed('types.[]', function() {
    return this.get('types').filterBy('caseTypeType', 'CUSTOM');
  }),

  isPlanEnabled: computed('plan', function() {
    return this.get('plan').has('custom_case_types');
  }),

  // Tasks
  addType: task(function * () {
    const type = this.get('types').createRecord();
    try {
      yield this.get('startEditing').perform(type);
    } catch (e) {
      type.rollbackAttributes();
    }
  }).drop(),

  startEditing: task(function * (type) {
    yield this.get('cancelEditing').perform();
    this.set('originalType', type);
    this.set('editedType', this.get('virtualModel').makeSnapshot(type, schema));
  }).drop(),

  cancelEditing: task(function * () {
    if (this.get('editedType') && isEdited(this.get('originalType'), this.get('editedType'), schema)) {
      yield this.get('confirmation').confirm({
        intlConfirmationHeader: 'generic.confirm.lose_changes_header',
        intlConfirmationBody: 'generic.confirm.lose_changes',
        intlConfirmLabel: 'generic.confirm.lose_changes_button'
      });
    }
    if (this.get('originalType.isNew')) {
      this.get('originalType').rollbackAttributes();
    }
    this.set('originalType', null);
    this.set('editedType', null);
  }).drop(),

  saveType: task(function * () {
    yield this.get('virtualModel').save(this.get('originalType'), this.get('editedType'), schema);
    if (variation('release-event-tracking') && this.get('originalType.isNew')) {
      this.get('metrics').trackEvent({
        event: 'type_created'
      });
    }
    this.set('originalType', null);
    this.set('editedType', null);
  }).drop(),

  removeType: task(function * (type) {
    yield this.get('confirmation').confirm({
      intlConfirmLabel: 'generic.confirm.delete_button',
      intlConfirmationBody: 'generic.confirm_delete.body'
    });
    type.destroyRecord();
  }).drop(),

  editedTypeObserver: observer('editedType', function () {
    this.get('onEditedChange')(Boolean(this.get('editedType')));
  }),

  willDestroyElement() {
    if (this.get('originalType.isNew')) {
      this.get('originalType').rollbackAttributes();
    }
  },

  actions: {
    removeType(type, event) {
      event.stopPropagation();
      this.get('removeType').perform(type);
    }
  }
});
