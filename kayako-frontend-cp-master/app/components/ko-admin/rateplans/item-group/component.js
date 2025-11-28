import { computed } from '@ember/object';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import _ from 'npm:lodash';

export default Component.extend({
  tagName: '',

  // attributes
  rateplans: [],
  // rateplan: null,
  selectedPlan: null,
  isDisabled: false,
  selectedTerm: null,
  selectedNumberOfSeats: '0', // make sure it is string
  selectedNumberOfCollaborators: '0', // make sure it is string
  defaultNumberOfCollaborators: '0', // bidirectional
  selectedSubscriptionDuration: {id: 3, text: '3 Years'}, // bidirectional,
  seatsLimit: '0',  // make sure it is string
  collaboratorsLimit: '0',  // make sure it is string
  grossTotal: 0,
  calculatingSummary: false,
  nextChargeDate: null,
  subscriptionAmount: 0,
  discountAmount: 0,
  stickySummary: false,

  // Services
  ratePlansService: service('rateplans'),
  plan: service(),
  store: service(),
  notification: service('notification'),
  i18n: service(),

  rateplan: computed('rateplanGroup', function() {
    return this.get('rateplanGroup')[2];
  }),

  numberOfCollaborators: computed('rateplan', 'selectedTerm', function() {
    const selectedTerm = this.get('selectedTerm');
    // can sometimes be undefined
    return this.get(`rateplan.${selectedTerm}.collaborators`) || 0;
  }),

  isSelected: computed('selectedPlan.{key,productId}', 'rateplan.{key,productId}', function() {
    try {
      return this.get('rateplanGroup').findIndex(plan=>plan.label===this.get('selectedPlan').label)>-1;
    } catch(err) {
      return false;
    }
  }),

  canAddCollaborators: computed('selectedPlan', function() {
    const plan = this.get('selectedPlan');

    return !plan.key.startsWith('enterprise');
  }),

  init() {
    this._super(...arguments);
    this.get('load').perform();
  },

  load: task(function * () {
    if (this.get('plan.isTrial')) { return; }

    yield this.get('loadSubscription').perform();
  }).restartable(),

  loadSubscription: task(function * () {
    if (this.get('subscription')) { return; }

    let store = this.get('store');
    let subscription = yield store.queryRecord('subscription', {});

    this.set('subscription', subscription);
  }),

  subscriptionRatePlan: computed('subscription.rateplans', function () {
    if (this.get('subscription.rateplans') !== undefined) {
      return this.get('ratePlansService').getSubscriptionRatePlan(this.get('subscription.rateplans'));
    }
    return;
  }),

  subscribedPlanKey: computed('subscriptionRatePlan.productRateplan.key', function () {
    if (this.get('plan.isTrial')) { return; }

    return this.get('subscriptionRatePlan.productRateplan.key');
  }),

  actions:{
    clicked: function(plan) {
      if (!this.get('plan.isTrial')) {
        let canChangeSupportPlan = true;
        const subscribedPlanKey = this.get('subscribedPlanKey');

        if (subscribedPlanKey.includes('gold') && (plan.key).includes('standard')) {
          canChangeSupportPlan = false;
        }

        if (subscribedPlanKey.includes('platinum')) {
          canChangeSupportPlan = false;
        }

        if (!canChangeSupportPlan) {
          this.get('notification').add({
            type: 'error',
            title: this.get('i18n').t('generic.block_subscription_downgrade'),
            autodismiss: true
          });

          return;
        }
      }

      this.set('rateplan', plan); 
      this.set('selectedPlan', plan); 
      this.sendAction('switchPlan', plan);
      this.sendAction('agentsChanged', {target:{value:this.get('selectedNumberOfSeats')}}, this.get('selectedSubscriptionDuration'));
    },
    
    updateSubscriptionDurationValue: function (duration) {
      this.setSubscriptionDuration(duration);
      this.sendAction('switchSubscriptionDuration', duration);
    },

    switchSubscriptionDuration(duration) {
      this.setSubscriptionDuration(duration);
    },
  },

  mixedCaseOptions: computed(function() {
    const subscriptionDurationOptions = [
      {label: '1 Year', value: 1},
      {label: '3 Years', value: 3},
      {label: '5 Years', value: 5}
    ];

    const mixedCaseOptions = _.map(subscriptionDurationOptions, (item, key)=>({ id: item.value, text: item.label }));
    this.set('selectedSubscriptionDuration', mixedCaseOptions[1]);
    return mixedCaseOptions;
  }),

  setSubscriptionDuration(duration) {
    if (duration === null) {
      return;
    }

    const subscriptionDurationOptions = [
      {label: '1 Year', value: 1},
      {label: '3 Years', value: 3},
      {label: '5 Years', value: 5}
    ];
    const mixedsubscriptionDurationOptions = _.map(subscriptionDurationOptions, (item, key)=>({ id: item.value, text: item.label }));

    if (this.get('selectedSubscriptionDuration') === null) {
      this.set('selectedSubscriptionDuration', mixedsubscriptionDurationOptions[1]);
    }

    if (duration !== null) {
      this.set('selectedSubscriptionDuration', duration);
    }

    this.sendAction('agentsChanged', {target:{value:this.get('selectedNumberOfSeats')}}, this.get('selectedSubscriptionDuration'));
  },

});
