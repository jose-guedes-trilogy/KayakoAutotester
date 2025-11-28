import { filterBy } from '@ember/object/computed';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';

export default Component.extend({
  // Attributes
  triggers: [],
  edit: null,

  // Services
  store: service(),
  i18n: service(),
  notification: service(),
  confirmation: service(),

  // CPs
  enabledTriggers: filterBy('triggers', 'isEnabled', true),
  disabledTriggers: filterBy('triggers', 'isEnabled', false),
  sortedEnabledTriggers: computed('enabledTriggers.@each.executionOrder', function() {
    return this.get('enabledTriggers').toArray().sortBy('executionOrder');
  }),
  sortedDisabledTriggers: computed('disabledTriggers.@each.title', function() {
    return this.get('disabledTriggers').toArray().sortBy('title');
  }),

  // Actions
  actions: {
    toggleStatus(trigger, e) {
      e.stopPropagation();
      e.preventDefault();
      let numberOfEnabledTriggers = this.get('enabledTriggers.length');
      let isEnabled = trigger.toggleProperty('isEnabled');
      trigger.set('executionOrder', isEnabled ? numberOfEnabledTriggers : null);
      trigger.save();
    },

    delete(trigger, e) {
      e.preventDefault();
      e.stopPropagation();
      this.get('confirmation')
        .confirm({ intlConfirmationBody: 'generic.confirm.delete' })
        .then(() => trigger.destroyRecord())
        .then(() => this.get('notification').success(this.get('i18n').t('admin.triggers.delete.success_message')));
    },

    reorder(newOrder) {
      let data = { trigger_ids: newOrder.mapBy('id') };
      let appInstance = getOwner(this);
      let applicationAdapter = appInstance.lookup('adapter:application');
      let url = applicationAdapter.urlPrefix() + '/triggers/reorder';
      newOrder.forEach((trigger, index) => trigger.set('executionOrder', index));
      applicationAdapter.ajax(url, 'PUT', { data }).then(response => {
        this.get('store').pushPayload('triggers', response);
      });
    }
  }
});
