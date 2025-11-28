import { filterBy } from '@ember/object/computed';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';

export default Component.extend({
  store: service(),
  i18n: service(),
  notification: service(),
  confirmation: service(),

  // CPs
  enabledMonitors: filterBy('monitors', 'isEnabled', true),
  disabledMonitors: filterBy('monitors', 'isEnabled', false),
  sortedEnabledMonitors: computed('enabledMonitors.@each.executionOrder', function() {
    return this.get('enabledMonitors').toArray().sortBy('executionOrder');
  }),
  sortedDisabledMonitors: computed('disabledMonitors.@each.title', function() {
    return this.get('disabledMonitors').toArray().sortBy('title');
  }),

  // Actions
  actions: {
    toggleStatus(monitor, e) {
      e.stopPropagation();
      e.preventDefault();
      let numberOfEnabledMonitors = this.get('enabledMonitors.length');
      let isEnabled = monitor.toggleProperty('isEnabled');
      monitor.set('executionOrder', isEnabled ? numberOfEnabledMonitors : null);
      monitor.save();
    },

    delete(monitor, e) {
      e.preventDefault();
      e.stopPropagation();
      this.get('confirmation')
        .confirm({ intlConfirmationBody: 'generic.confirm.delete' })
        .then(() => monitor.destroyRecord())
        .then(() => this.get('notification').success(this.get('i18n').t('admin.monitors.delete.success_message')));
    },

    reorder(newOrder) {
      let data = { monitor_ids: newOrder.mapBy('id') };
      let appInstance = getOwner(this);
      let applicationAdapter = appInstance.lookup('adapter:application');
      let url = applicationAdapter.urlPrefix() + '/monitors/reorder';
      newOrder.forEach((monitor, index) => monitor.set('executionOrder', index));
      applicationAdapter.ajax(url, 'PUT', { data }).then(response => {
        this.get('store').pushPayload('monitors', response);
      });
    }
  }
});
