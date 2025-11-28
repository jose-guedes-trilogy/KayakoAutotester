import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  // attributes
  rateplanLabel: null,
  selectedNumberOfSeats: null,
  subscriptionAmount: 0,
  calculatingSummary: false,
  currency: null,
  selectedTerm: null,
  nextChargeDate: null,
  discountAmount: 0,
  grossTotal: 0,
  isDisabled: false
});
