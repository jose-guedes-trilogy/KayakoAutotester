import { oneWay } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  confirmation: service(),

  activeConfirmation: oneWay('confirmation.activeConfirmation'),

  actions: {
    onCancel() {
      this.get('confirmation').cancelConfirmation();
    },

    onConfirm() {
      this.get('confirmation').acceptConfirmation();
    }
  }
});

