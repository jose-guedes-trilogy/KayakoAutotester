import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { observer, computed } from '@ember/object';
import { task } from 'ember-concurrency';
import { attr, isEdited, model } from 'frontend-cp/services/virtual-model';

import { variation } from 'ember-launch-darkly';

const OPEN_STATUS_TYPES = ['NEW', 'OPEN', 'PENDING'];
const CLOSED_STATUS_TYPES = ['CLOSED', 'COMPLETED'];

const schema = model('case-status', {
  label: attr(),
  isSlaActive: attr()
});

export default Component.extend({
  // HTML
  tagName: '',

  // Attributes
  statuses: [],
  onEditedChange: () => {},

  // State
  originalStatus: null,
  editedStatus: null,

  // Services
  confirmation: service(),
  plan: service(),
  sorter: service(),
  virtualModel: service(),
  metrics: service(),

  openStatuses: computed('statuses.[]', function() {
    return this.get('statuses').filter(status => {
      return OPEN_STATUS_TYPES.indexOf(status.get('statusType')) !== -1;
    });
  }),

  closedStatuses: computed('statuses.[]', function() {
    return this.get('statuses').filter(status => {
      return CLOSED_STATUS_TYPES.indexOf(status.get('statusType')) !== -1;
    });
  }),

  customStatuses: computed('statuses.@each.sortOrder', function() {
    return this.get('statuses').filter(status => {
      return OPEN_STATUS_TYPES.indexOf(status.get('statusType')) === -1 &&
        CLOSED_STATUS_TYPES.indexOf(status.get('statusType')) === -1;
    }).sortBy('sortOrder');
  }),

  isPlanEnabled: computed('plan', function() {
    return this.get('plan').has('custom_case_statuses');
  }),

  // Tasks
  addStatus: task(function * () {
    const status = this.get('statuses').createRecord({
      sortOrder: this.get('customStatuses.lastObject.sortOrder') + 1
    });
    try {
      yield this.get('startEditing').perform(status);
    } catch (e) {
      status.rollbackAttributes();
    }
  }).drop(),

  startEditing: task(function * (status) {
    yield this.get('cancelEditing').perform();
    this.set('originalStatus', status);
    this.set('editedStatus', this.get('virtualModel').makeSnapshot(status, schema));
  }).drop(),

  cancelEditing: task(function * () {
    if (this.get('editedStatus') && isEdited(this.get('originalStatus'), this.get('editedStatus'), schema)) {
      yield this.get('confirmation').confirm({
        intlConfirmationHeader: 'generic.confirm.lose_changes_header',
        intlConfirmationBody: 'generic.confirm.lose_changes',
        intlConfirmLabel: 'generic.confirm.lose_changes_button'
      });
    }
    if (this.get('originalStatus.isNew')) {
      this.get('originalStatus').rollbackAttributes();
    }
    this.set('originalStatus', null);
    this.set('editedStatus', null);
  }).drop(),

  saveStatus: task(function * () {
    const statusIsNew = this.get('originalStatus.isNew');
    yield this.get('virtualModel').save(this.get('originalStatus'), this.get('editedStatus'), schema);
    this.set('originalStatus', null);
    this.set('editedStatus', null);
    if (statusIsNew) {
      // this will change our sortOrder
      yield this.get('statuses').reload();
      if (variation('release-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'status_created'
        });
      }
    }
  }).drop(),

  removeStatus: task(function * (status) {
    yield this.get('confirmation').confirm({
      intlConfirmLabel: 'generic.confirm.delete_button',
      intlConfirmationBody: 'generic.confirm_delete.body'
    });
    yield status.destroyRecord();
    yield this.get('statuses').reload();
  }).drop(),

  editedStatusObserver: observer('editedStatus', function () {
    this.get('onEditedChange')(Boolean(this.get('editedStatus')));
  }),

  willDestroyElement() {
    if (this.get('originalStatus.isNew')) {
      this.get('originalStatus').rollbackAttributes();
    }
  },

  actions: {
    reorderList(customStatuses) {
      const openStatuses = this.get('openStatuses');
      const closedStatuses = this.get('closedStatuses');
      const orderedStatuses = [].concat(openStatuses, customStatuses, closedStatuses);
      this.get('sorter').sort(orderedStatuses, {startingIndex: 1});
    },

    removeStatus(status, event) {
      event.stopPropagation();
      this.get('removeStatus').perform(status);
    }
  }
});
