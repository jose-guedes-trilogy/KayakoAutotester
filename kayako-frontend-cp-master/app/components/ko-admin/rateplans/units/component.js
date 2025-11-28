import Component from '@ember/component';
import * as KeyCodes from 'frontend-cp/lib/keycodes';

export default Component.extend({
  tagName: 'span',

  // attributes
  seatsLimit: '0',
  collaboratorsLimit: '0',
  seatsLabel: 'account.trial.agents.input.label',
  isDisabled: false,
  selectedNumberOfSeats: '0',
  keyDown: function (e) {
    if (e.keyCode === KeyCodes.equalSign || e.keyCode === KeyCodes.dash || e.keyCode === KeyCodes.period) {
      e.preventDefault();
    }
  }
});
