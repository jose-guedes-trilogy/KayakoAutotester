import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  // attributes
  rateplan: null,
  selectedPlan: null,
  isDisabled: false,
  selectedTerm: null,
  selectedNumberOfSeats: '0', // make sure it is string
  seatsLimit: '0',  // make sure it is string
  grossTotal: 0,
  calculatingSummary: false,
  nextChargeDate: null,
  subscriptionAmount: 0,
  discountAmount: 0,
  stickySummary: false,

  numberOfCollaborators: computed('rateplan', 'selectedTerm', function() {
    const selectedTerm = this.get('selectedTerm');
    // can sometimes be undefined
    return this.get(`rateplan.${selectedTerm}.collaborators`) || 0;
  }),

  isSelected: computed('selectedPlan.{key,productId}', 'rateplan.{key,productId}', function() {
    let selectedKey = this.get('selectedPlan.key');
    let selectedProductId = this.get('selectedPlan.productId');
    let myKey = this.get('rateplan.key');
    let myProductId = this.get('rateplan.productId');

    return selectedKey === myKey && selectedProductId === myProductId;
  })
});
