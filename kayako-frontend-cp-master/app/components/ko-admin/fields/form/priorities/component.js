import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { observer, computed } from '@ember/object';
import { task } from 'ember-concurrency';
import { attr, isEdited, model } from 'frontend-cp/services/virtual-model';

import { variation } from 'ember-launch-darkly';

const schema = model('case-priority', {
  label: attr()
});

export default Component.extend({
  // HTML
  tagName: '',

  // Attributes
  priorities: [],
  onEditedChange: () => {},

  // State
  originalPriority: null,
  editedPriority: null,

  // Services
  confirmation: service(),
  plan: service(),
  sorter: service(),
  virtualModel: service(),
  metrics: service(),

  sortedPriorities: computed('priorities.@each.level', function() {
    return this.get('priorities').sortBy('level');
  }),

  isPlanEnabled: computed('plan', function() {
    return this.get('plan').has('custom_case_priorities');
  }),

  // Tasks
  addPriority: task(function * () {
    const priority = this.get('priorities').createRecord({
      level: this.get('sortedPriorities.lastObject.level') + 1
    });
    try {
      yield this.get('startEditing').perform(priority);
    } catch (e) {
      priority.rollbackAttributes();
    }
  }).drop(),

  startEditing: task(function * (priority, e) {
    yield this.get('cancelEditing').perform();
    this.set('originalPriority', priority);
    this.set('editedPriority', this.get('virtualModel').makeSnapshot(priority, schema));
  }).drop(),

  cancelEditing: task(function * () {
    if (this.get('editedPriority') && isEdited(this.get('originalPriority'), this.get('editedPriority'), schema)) {
      yield this.get('confirmation').confirm({
        intlConfirmationHeader: 'generic.confirm.lose_changes_header',
        intlConfirmationBody: 'generic.confirm.lose_changes',
        intlConfirmLabel: 'generic.confirm.lose_changes_button'
      });
    }
    if (this.get('originalPriority.isNew')) {
      this.get('originalPriority').rollbackAttributes();
    }
    this.set('originalPriority', null);
    this.set('editedPriority', null);
  }).drop(),

  savePriority: task(function * () {
    yield this.get('virtualModel').save(this.get('originalPriority'), this.get('editedPriority'), schema);
    if (variation('release-event-tracking') && this.get('originalPriority.isNew')) {
      this.get('metrics').trackEvent({
        event: 'priority_created'
      });
    }
    this.set('originalPriority', null);
    this.set('editedPriority', null);
  }).drop(),

  removePriority: task(function * (priority) {
    yield this.get('confirmation').confirm({
      intlConfirmLabel: 'generic.confirm.delete_button',
      intlConfirmationBody: 'generic.confirm_delete.body'
    });
    priority.destroyRecord();
  }).drop(),

  editedPriorityObserver: observer('editedPriority', function () {
    this.get('onEditedChange')(Boolean(this.get('editedPriority')));
  }),

  willDestroyElement() {
    if (this.get('originalPriority.isNew')) {
      this.get('originalPriority').rollbackAttributes();
    }
  },

  actions: {
    reorderList(casePriorities) {
      this.get('sorter').sort(casePriorities);
    },

    removePriority(priority, event) {
      event.stopPropagation();
      this.get('removePriority').perform(priority);
    }
  }
});
