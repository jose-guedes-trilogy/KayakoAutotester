import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  //Attrs
  operators: null,
  selectedOperator: null,

  //State

  //CP's
  pillColor: computed('selectedOperator', 'operators', function() {
    let selectedOperator = this.get('selectedOperator');
    let operators = this.get('operators');

    return operators.indexOf(selectedOperator) % 2;
  }),

  //Functions

  //Actions
  actions: {
    changeOperator() {
      let selectedOperator = this.get('selectedOperator');
      let operators = this.get('operators');
      let newOperator = operators[operators.indexOf(selectedOperator) +1] || operators[0];

      this.sendAction('onOperatorChange', newOperator);
    }
  }
});
