import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({

  // Attributes
  card: {},

  // Computed Properties
  expiryMonth: computed('card.expiryMonth', function () {
    const expiryMonth = this.get('card.expiryMonth');
    return expiryMonth < 10 ? `0${expiryMonth}` : expiryMonth;
  }),

  cardNumber: computed('card.number', function () {
    const cardNumber = this.get('card.number');
    return typeof (cardNumber) === 'string' ? cardNumber.substr(cardNumber.length - 4) : null;
  }),

  // Actions
  actions: {

    markAsDefault () {
      this.sendAction('whenMarkAsDefault', this.get('card'));
    },

    /*
     * removing a card
     */
    removeCard (card) {
      card
      .destroyRecord()
      .catch(() => {
        card.rollbackAttributes();
      });
    }
  }

});
