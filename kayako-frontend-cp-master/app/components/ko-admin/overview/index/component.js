import { readOnly } from '@ember/object/computed';
import { computed } from '@ember/object';
import Component from '@ember/component';
import { inject as service } from '@ember/service';

import { variation } from 'ember-launch-darkly';

export default Component.extend({

  // Attributes
  cards: [],
  subscription: {},
  invoices: [],

  // services
  plan: service(),
  metrics: service(),

  // Computed Properties
  defaultCard: computed('cards', function () {
    return this.get('cards').findBy('isDefault', true);
  }),

  subscribedPlanName: computed('subscription.rateplans', function () {
    return this.get('subscription.rateplans.firstObject.productRateplan.name');
  }),

  accountBalance: readOnly('subscription.account.balance'),
  expiryAt: readOnly('plan.expiryAt'),
  accountCurrency: readOnly('subscription.account.billing.currency'),

  actions: {
    openSupportConversation() {
      if (variation('ops-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'Account overview - Cancel subscription initiate',
          category: 'Account'
        });
      }

      window.open('https://support.kayako.com/conversation/new/3', 'cancel-contact-support', { noopener: true });
    }
  }

});
