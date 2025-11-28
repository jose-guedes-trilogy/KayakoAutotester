import { filterBy } from '@ember/object/computed';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  // Attributes
  webhooks: [],
  edit: null,

  // Services
  store: service(),
  i18n: service(),
  notification: service(),
  confirmation: service(),

  // CPs
  enabledWebhooks: filterBy('webhooks', 'isEnabled', true),
  disabledWebhooks: filterBy('webhooks', 'isEnabled', false),
  sortedEnabledWebhooks: computed('enabledWebhooks.@each.label', function() {
    return this.get('enabledWebhooks').toArray().sortBy('label');
  }),
  sortedDisabledWebhooks: computed('disabledWebhooks.@each.label', function() {
    return this.get('disabledWebhooks').toArray().sortBy('label');
  }),

  // Actions
  actions: {
    toggleStatus(webhook, e) {
      e.stopPropagation();
      e.preventDefault();

      webhook.toggleProperty('isEnabled');
      webhook.save();
    },

    delete(webhook, e) {
      e.preventDefault();
      e.stopPropagation();
      return this.get('confirmation').confirm({
        intlConfirmationBody: 'generic.confirm.delete'
      })
      .then(() => webhook.destroyRecord())
      .then(() => {
        let msg = this.get('i18n').t('admin.apps.webhooks.delete.success_message');
        this.get('notification').success(msg);
      });
    }
  }
});
