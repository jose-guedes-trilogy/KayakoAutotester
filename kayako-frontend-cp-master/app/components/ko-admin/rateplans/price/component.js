import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  // attributes
  amount: 0,
  currency: null,
  unitFee: 0,
  flatUpto: 0,
  perUnit: 'account.plans.priceFor.perAgent'
});
