import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  //Attrs
  definitions: null,
  currentPredicateCollections: null,
  currentPropositionOperators: null,
  currentCollectionOperator: null,

  //State
  oldPredicateCollections: null,

  //Serivces

  //Lifecycle Hooks
  didReceiveAttrs() {
    this._super(...arguments);
    let oldPredicateCollections = this.get('oldPredicateCollections');
    let newPredicateCollections = this.get('currentPredicateCollections');

    if (oldPredicateCollections && oldPredicateCollections.values() !== newPredicateCollections.values()) {
      this.notifyPropertyChange('currentPredicateCollections');
    }

    this.set('oldPredicateCollections', new Set(newPredicateCollections));

    let oldPropositionOperators = this.get('oldPropositionOperators');
    let newPropositionOperators = this.get('currentPropositionOperators');

    if (oldPropositionOperators && oldPropositionOperators !== newPropositionOperators) {
      this.notifyPropertyChange('currentPropositionOperators');
    }

    this.set('oldPropositionOperators', newPropositionOperators);
  },

  //CP's
  collectionOperators: computed(function() {
    return ['OR', 'AND'];
  }),

  //Functions

  //Actions
  actions: {
    setCollectionOperator(operator) {
      this.sendAction('onCollectionOperatorChange', operator);
    }
  }
});
