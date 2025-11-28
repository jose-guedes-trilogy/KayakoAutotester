import moment from 'moment';
import config from 'frontend-cp/config/environment';
import Service from '@ember/service';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { reads, bool } from '@ember/object/computed';

export default Service.extend({
  store: service(),
  date: service(),

  plan: null,

  accountId: reads('plan.accountId'),
  billing: reads('plan.billing'),
  expiryAt: reads('plan.expiryAt'),
  features: reads('plan.features'),
  isGrandfathered: reads('plan.isGrandfathered'),
  leadId: reads('plan.leadId'),
  limits: reads('plan.limits'),
  name: reads('plan.name'),
  opportunityId: reads('plan.opportunityId'),
  product: reads('plan.product'),
  subscriptionId: reads('plan.subscriptionId'),
  rateplanId: reads('plan.rateplanId'),

  limitFor(name) {
    return this.get(`limits.${name}`);
  },

  has(code) {
    return (this.get('features') || []).isAny('code', code);
  },

  isTrial: computed('plan.{accountId,isGrandfathered,leadId,opportunityId,rateplanId,subscriptionId}', function () {
    if (config.APP.forceTrial) {
      return true;
    }

    if (!this.get('plan')) {
      return false;
    }

    const hasLead = !!this.get('plan.leadId');
    const notYetConfigured = !this.get('plan.leadId') &&
      !this.get('plan.opportunityId') &&
      !this.get('plan.accountId') &&
      !this.get('plan.subscriptionId') &&
      !this.get('plan.rateplanId') &&
      !this.get('plan.isGrandfathered');

    return hasLead || notYetConfigured;
  }),

  isSandbox: bool('plan.opportunityId'),

  isOnDemandSandbox: computed('isSandbox', 'plan.isGrandfathered', 'plan.accountId', function () {
    return this.get('isSandbox') && (!this.get('plan.isGrandfathered') && !this.get('plan.accountId'));
  }),

  daysLeftInTrial: computed('plan.expiryAt', function () {
    var currentDate = this.get('date').getCurrentDate();
    return moment(this.get('plan.expiryAt')).diff(moment(currentDate), 'days');
  }),

  fetchPlan() {
    let store = this.get('store');

    store.unloadAll('plan');
    return store.queryRecord('plan', {}).then(plan => {
      this.set('plan', plan);
    });
  }
});
