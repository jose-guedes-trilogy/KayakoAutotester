import { reads } from '@ember/object/computed';
import { bind } from '@ember/runloop';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import _ from 'npm:lodash';

import { variation } from 'ember-launch-darkly';
import { task } from 'ember-concurrency';

export default Component.extend({
  // Attributes
  rateplans: null,
  ratePlanTerms: null,
  disableActions: false,
  selectedPlan: null, // bidirectional
  selectedTerm: null, // bidirectional
  selectedNumberOfCollaborators: null, // bidirectional
  defaultNumberOfCollaborators: null, // bidirectional
  selectedNumberOfSeats: null, // bidirectional
  selectedSubscriptionDuration: {id: 3, text: '3 Years'}, // bidirectional
  grossTotal: 0,
  nextChargeDate: null,
  subscriptionAmount: 0,
  discountAmount: 0,
  calculatingSummary: false,
  onCtaComparePlans: function() {},
  _stickySummary: false,
  _didScroll: null,

  // Services
  i18n: service(),
  metrics: service(),
  notificationService: service('notification'),
  ratePlansService: service('rateplans'),
  plan: service(),
  store: service(),

  // CP's
  legacyRateplans: computed('rateplans', function() {
    let rateplans = this.get('rateplans');

    if ('legacy' in rateplans) {
      return rateplans.legacy;
    } else {
      return [];
    }
  }),

  latestRateplans: computed('rateplans', function() {
    let rateplans = this.get('rateplans');

    if ('latest' in rateplans) {
      return rateplans.latest;
    } else {
      return rateplans;
    }
  }),

  noRateplansAvailable: computed('latestRateplans', 'legacyRateplans', function() {
    if (this.get('latestRateplans').length || this.get('legacyRateplans').length) {
        return false;
    }
    return true;
  }),

  ratePlanGroups: computed('latestRateplans', function() {
    const matchTillFirstUnderscore = new RegExp('^[^_]+(?=_)');
    const rateplans = this.get('latestRateplans');
    const ratePlanGroups = _.chain(rateplans)
      .groupBy(rateplan => {
        const match = rateplan.key.match(matchTillFirstUnderscore);
        return (match && match.toString()) || rateplan.key;
      })
      .values()
      .value();

      return ratePlanGroups;
  }),

  seatsLimit: computed('selectedPlan', 'selectedTerm.value', function () {
    return this.get('ratePlansService').getSeatsLimit(this.get('selectedPlan'), this.get('selectedTerm.value'));
  }),

  savings: computed('selectedPlan', 'selectedNumberOfSeats', function () {
    return {
      ANNUAL: this.get('ratePlansService').getAnnualSavings(this.get('selectedPlan'), this.get('selectedNumberOfSeats'))
    };
  }),

  currency: reads('selectedPlan.currency'),

  // LifeCycle Hooks
  didInsertElement () {
    this._didScroll = bind(this, 'didScroll');
    $(window).on('scroll', this._didScroll);
  },

  willDestroyElement () {
    $(window).off('scroll', this._didScroll);
  },

  didScroll () {
    const margin = 230;
    const elementHeight = $(this.get('element')).height();
    if ($(document).scrollTop() >= (elementHeight + margin) && !this.get('_stickySummary')) {
      this.set('_stickySummary', true);
    } else if ($(document).scrollTop() < (elementHeight + margin) && this.get('_stickySummary')) {
      this.set('_stickySummary', false);
    }
  },

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

  subscribedPlanCollaborators: computed('subscriptionRatePlan.charges', function () {
    if (this.get('subscriptionRatePlan.charges') !== undefined) {
      return this.get('ratePlansService').getCollaboratorsQuantity(this.get('subscriptionRatePlan.charges')) || 0;
    }
    return;
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

    this.sendAction('switchSubscriptionDuration', this.get('selectedSubscriptionDuration'));
  },

  actions: {
    termChanged: function (term) {
      const selectedPlan = this.get('selectedPlan');

      if (selectedPlan && !selectedPlan[term.value]) {
        const formatedMessage = this.get('i18n').t('account.plans.term.cannotSwitch', {
          term: term.value,
          plan: selectedPlan.label
        });
        this.get('notificationService').error(formatedMessage);
        return;
      }
      this.set('selectedTerm', term);
      this.sendAction('switchPlan', selectedPlan);
      this.sendAction('agentsChanged', {target:{value:this.get('selectedNumberOfSeats')}});
    },

    seatsChanged: function (e) {
      /**
       * this makes sure the end-user can press
       * backspace and freely enter values
       */
      if (!e.target.value) {
        return;
      }

      /**
       * if we have some value, then we should validate
       * it and fire actions.
       */
      let newSeatsValue = Math.round(e.target.value);
      if (newSeatsValue < 1) {
        newSeatsValue = 1;
      }
      const seatsLimit = Number(this.get('seatsLimit'));
      if (seatsLimit && newSeatsValue > seatsLimit) {
        newSeatsValue = String(seatsLimit);
        this.get('notificationService').add({
          type: 'error',
          title: this.get('i18n').t('account.plans.seats.cannotIncrease'),
          autodismiss: true,
          unique: true
        });
      }
      e.target.value = String(newSeatsValue);
      this.set('selectedNumberOfSeats', newSeatsValue);
      this.sendAction('seatsSwitched');
    },

    switchPlan: function (plan) {
      const currentTerm = this.get('selectedTerm.value');
      if (!plan[currentTerm] || this.get('disableActions') || plan[currentTerm].actualId === this.get(`selectedPlan.${currentTerm}.actualId`)) {
        return;
      }

      /**
       * The backend API defines the default number of collaborators for each plan
       */
      this.set('selectedNumberOfCollaborators', plan[currentTerm].collaborators);
      this.set('defaultNumberOfCollaborators', plan[currentTerm].collaborators);

      if (this.get('subscribedPlanCollaborators') !== undefined) {
        this.set('selectedNumberOfCollaborators', this.get('subscribedPlanCollaborators'));
      }

      const seatsLimit = this.get('ratePlansService').getSeatsLimit(plan, currentTerm);
      if (seatsLimit && seatsLimit < this.get('selectedNumberOfSeats')) {
        this.get('notificationService').error(this.get('i18n').t('account.plans.plan.cannotSwitch'));
        if (variation('release-event-tracking')) {
          this.get('metrics').trackEvent({
            event: 'plan_switched_failed',
            current_seats: seatsLimit,
            selected_seats: this.get('selectedNumberOfSeats')
          });
        }

        return;
      }
      this.set('selectedPlan', plan);
      this.sendAction('planSwitched');
      this.sendAction('agentsChanged', {target:{value:this.get('selectedNumberOfSeats')}});
    },

    switchSubscriptionDuration(duration) {
      this.setSubscriptionDuration(duration);
    },

  }
});
