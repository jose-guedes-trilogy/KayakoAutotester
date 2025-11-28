import Component from '@ember/component';
import { computed } from '@ember/object';
import moment from 'moment';

export default Component.extend({
  tagName: '',

  //Attrs
  definition: null,
  currentPropositions: null,
  positionInPropositions: null,

  //State

  //Serivces

  //Lifecycle Hooks

  //CP's
  selectedOperator: computed('currentPropositions.[]', 'positionInPropositions', function() {
    let currentPropositions = this.get('currentPropositions');
    let positionInPropositions = this.get('positionInPropositions');

    return currentPropositions[positionInPropositions].operator;
  }),

  operatorDefinitionForSelected: computed('selectedOperator', function() {
    return this.get('definition.operators').find(operator => {
      return operator.get('label') === this.get('selectedOperator');
    });
  }),

  //Actions
  actions: {
    onSelectedOperatorChange(selectedOperator) {
      let currentPropositions = this.get('currentPropositions');
      let positionInPropositions = this.get('positionInPropositions');
      let inputType = this.get('definition.operators').find(operator => {
        return operator.get('label') === selectedOperator.get('label');
      }).get('input.inputType');
      let value = currentPropositions[positionInPropositions].value;

      if (inputType === 'DATE_ABSOLUTE' && !moment(value).isValid()) {
        value = null;
      } else if (inputType === 'DATE_RELATIVE' && moment(value).isValid()) {
        value = null;
      }

      this.sendAction('onPropositionsChange', positionInPropositions, {
        label: this.get('definition.label').toLowerCase(),
        field: selectedOperator.get('originalFieldName'),
        operator: selectedOperator.get('label'),
        value: value
      });
    }
  }
});
