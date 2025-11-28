import Component from '@ember/component';
import { computed } from '@ember/object';
import { notEmpty } from '@ember/object/computed';

export default Component.extend({
  tagName: '',

  //Attrs
  definition: null,
  currentPredicateCollections: null,
  currentPropositionOperators: null,

  //State
  isChecked: false,
  oldCurrentPredicateCollections: false,

  //Serivces

  //Lifecycle Hooks
  didReceiveAttrs() {
    this._super(...arguments);

    let oldPropositionOperators = this.get('oldPropositionOperators');
    let newPropositionOperators = this.get('currentPropositionOperators');

    if (oldPropositionOperators && oldPropositionOperators !== newPropositionOperators) {
      this.notifyPropertyChange('currentPropositionOperators');
    }

    this.set('oldPropositionOperators', [...newPropositionOperators]);

    let oldCurrentPredicateCollections = this.get('oldCurrentPredicateCollections');
    let newCurrentPredicateCollections = this.get('currentPredicateCollections');

    if (oldCurrentPredicateCollections) {
      if (oldCurrentPredicateCollections.length !== newCurrentPredicateCollections.length) {
        this.notifyPropertyChange('currentPropositions');
        return;
      }

      oldCurrentPredicateCollections.forEach((proposition, i) => {
        if (proposition.label !== newCurrentPredicateCollections[i].label ||
            proposition.field !== newCurrentPredicateCollections[i].field ||
            proposition.operator !== newCurrentPredicateCollections[i].operator ||
            proposition.value !== newCurrentPredicateCollections[i].value) {

          this.notifyPropertyChange('currentPropositions');
          return;
        }
      });
    }

    this.set('oldCurrentPredicateCollections', [...newCurrentPredicateCollections]);
  },

  //CP's
  currentPropositions: computed('definition', 'currentPredicateCollections', function() {
    let definitionLabel = this.get('definition.label').toLowerCase();
    let currentPredicateCollections = this.get('currentPredicateCollections');

    return currentPredicateCollections.get(definitionLabel) || [];
  }),

  hasPropositions: notEmpty('currentPropositions'),

  propositionOperators: computed(function() {
    return ['AND', 'OR'];
  }),

  currentPropositionOperator: computed('currentPropositionOperators', 'definition.label', function() {
    let currentPropositionOperators = this.get('currentPropositionOperators');
    let definitionLabel = this.get('definition.label').toLowerCase();

    return currentPropositionOperators.get(definitionLabel);
  }),

  //Actions
  actions: {
    onCheck() {
      let definition = this.get('definition');
      let label = definition.get('label').toLowerCase();
      let currentPropositions = this.get('currentPropositions');
      let hasPropositions = this.get('hasPropositions');

      if (hasPropositions) {
        this.sendAction('onPropositionsRemoveAll', definition);
      } else {
        this.sendAction('onPropositionsChange', currentPropositions.length, {
          label: label,
          field: this.get('definition.operators.firstObject.originalFieldName'),
          operator: this.get('definition.operators.firstObject.label')
        });
      }
    },

    onAddProposition() {
      let currentPropositions = this.get('currentPropositions');
      let label = this.get('definition.label').toLowerCase();

      this.sendAction('onPropositionsChange', currentPropositions.length, {
        label: label,
        field: this.get('definition.operators.firstObject.originalFieldName'),
        operator: this.get('definition.operators.firstObject.label')
      });
    },

    onRemoveProposition(i, proposition) {
      this.sendAction('onPropositionsRemoval', i, proposition);
    },

    setPropositionOperator(operator) {
      let label = this.get('definition.label').toLowerCase();
      this.sendAction('onPropositionOperatorChange', label, operator);
    }
  }
});
