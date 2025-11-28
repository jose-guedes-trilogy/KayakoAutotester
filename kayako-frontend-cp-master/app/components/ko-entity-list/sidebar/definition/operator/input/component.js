import Component from '@ember/component';
import { computed } from '@ember/object';
import { dasherize } from '@ember/string';
import { inject as service } from '@ember/service';
import { task, timeout } from 'ember-concurrency';
import * as KeyCodes from 'frontend-cp/lib/keycodes';
import EmberObject from '@ember/object';
import moment from 'moment';

export default Component.extend({
  tagName: '',

  //Attrs
  definition: null,
  operatorDefinition: null,
  currentPropositions: null,
  positionInPropositions: null,

  //Serivces
  store: service(),

  //Lifecycle Hooks

  //CP's
  currentProposition: computed('currentPropositions.[]', 'positionInPropositions', function() {
    let currentPropositions = this.get('currentPropositions');
    let positionInPropositions = this.get('positionInPropositions');

    return currentPropositions[positionInPropositions];
  }),

  definitionInputType: computed('currentProposition', function() {
    let currentOperator = this.get('currentProposition').operator;
    let inputType = this.get('definition.operators').find(operator => {
      return operator.get('label') === currentOperator;
    }).get('input.inputType');

    if (inputType) {
      return dasherize(inputType.toLowerCase());
    } else {
      return null;
    }
  }),

  currentPropositionAsBooleanString: computed('currentProposition', function() {
    let currentProposition = this.get('currentProposition');

    if (currentProposition.value !== undefined) {
      return currentProposition.value.toString();
    } else {
      return currentProposition.value;
    }
  }),

  currentPropositionValueArray: computed('currentProposition', function() {
    let value = this.get('currentProposition').value;

    if (value) {
      return value;
    } else {
      return [];
    }
  }),

  currentPropositionValueStringAsArray: computed('currentProposition', function() {
    let value = this.get('currentProposition').value;

    if (value) {
      return value.split(',');
    } else {
      return [];
    }
  }),

  selectedOptionsFromValue: computed('currentPropositionValueStringAsArray', 'selectedOperatorDefinitionValueObjects', function() {
    let valueArray = this.get('currentPropositionValueStringAsArray');
    let options = this.get('selectedOperatorDefinitionValueObjects');

    return valueArray.map((valueString) => options.findBy('string', valueString));
  }),

  unselectedOptionsFromValue: computed('selectedOptionsFromValue', 'selectedOperatorDefinitionValueObjects', function() {
    let selectedOptionsFromValue = this.get('selectedOptionsFromValue');
    let options = this.get('selectedOperatorDefinitionValueObjects');

    return options.filter((option) => {
      return !selectedOptionsFromValue.findBy('string', option.get('string'));
    });
  }),

  selectedOptionsFromOption: computed('currentPropositionValueArray', 'selectedOperatorDefinitionValueObjects', function() {
    let valueArray = this.get('currentPropositionValueArray');
    let options = this.get('selectedOperatorDefinitionValueObjects');

    return valueArray.map((selectedOption) => options.findBy('string', selectedOption.string));
  }),

  unselectedOptionsFromOption: computed('selectedOptionsFromOption', 'selectedOperatorDefinitionValueObjects', function() {
    let selectedOptionsFromOption = this.get('selectedOptionsFromOption');
    let options = this.get('selectedOperatorDefinitionValueObjects');

    return options.filter((option) => {
      return !selectedOptionsFromOption.findBy('string', option.get('string'));
    });
  }),

  selectedTagsFromValue: computed('currentPropositionValueStringAsArray', function() {
    let valueArray = this.get('currentPropositionValueStringAsArray');

    return valueArray.map((valueString) => { return { name: valueString }; });
  }),

  currentPropositionValueAsAutocompleteObject: computed('currentProposition', function() {
    let currentPropositionValueObject = this.get('currentProposition').value;

    if (currentPropositionValueObject) {
      return {
        value: currentPropositionValueObject.value,
        string: currentPropositionValueObject.string
      };
    } else {
      return null;
    }
  }),

  booleanOptions: computed(function() {
    return ['true', 'false'];
  }),

  selectedOperatorDefinitionValueObjects: computed('operatorDefinition', function() {
    let options = this.get('operatorDefinition.input.values');

    return options.map(obj => {
      return new EmberObject(
        {
          value: Object.keys(obj)[0],
          string: Object.values(obj)[0]
        }
      );
    });
  }),

  currentlySelectedDefinitionValue: computed('currentProposition', 'selectedOperatorDefinitionValueObjects', function() {
    let currentProposition = this.get('currentProposition');
    let options = this.get('selectedOperatorDefinitionValueObjects');

    if (!options || !currentProposition) {
      return null;
    }

    let option = options.find(option => {
      return option.get('value') === currentProposition.value;
    });

    return option ? option : null;
  }),

  //Functions
  createPropositionChangeObj(value) {
    let positionInPropositions = this.get('positionInPropositions');

    return {
      label: this.get('definition.label').toLowerCase(),
      field: this.get('currentPropositions')[positionInPropositions].field,
      operator: this.get('currentPropositions')[positionInPropositions].operator,
      value: value
    };
  },

  //Tasks
  captureTextAndSetAsValue: task(function * (value) {
    yield timeout(1000);

    this.send('setValue', value);
  }).restartable(),

  //Actions
  actions: {
    handleEnterPressInInput(e) {
      if (e.keyCode === KeyCodes.enter) {
        this.get('captureTextAndSetAsValue').cancelAll();
        this.send('setValue', e.target.value);
      }
    },

    setValue(value) {
      this.sendAction('onPropositionsChange', this.get('positionInPropositions'), this.createPropositionChangeObj(value));
    },

    selectValue(option) {
      this.sendAction('onPropositionsChange', this.get('positionInPropositions'), this.createPropositionChangeObj(option.get('value')));
    },

    setBooleanValue(value) {
      this.sendAction('onPropositionsChange', this.get('positionInPropositions'), this.createPropositionChangeObj(value === 'true'));
    },

    addTagToValue(tag) {
      let currentlySelectedTagsAsStrings = this.get('selectedTagsFromValue').mapBy('name');
      let obj = this.createPropositionChangeObj(currentlySelectedTagsAsStrings.concat(tag.name).join(','));

      this.sendAction('onPropositionsChange', this.get('positionInPropositions'), obj);
    },

    removeTagFromValue(tag) {
      let currentlySelectedTagsAsStrings = this.get('selectedTagsFromValue').mapBy('name');
      let newSelectedTagsAsStrings = currentlySelectedTagsAsStrings.filter((tagName) => {
        return tagName !== tag.name;
      });
      let obj = this.createPropositionChangeObj(newSelectedTagsAsStrings.join(','));

      this.sendAction('onPropositionsChange', this.get('positionInPropositions'), obj);
    },

    setMultipleValue(options) {
      let value = options.map(option => {
        return { value: option.get('value'), string: option.get('string') };
      });

      this.sendAction('onPropositionsChange', this.get('positionInPropositions'), this.createPropositionChangeObj(value));
    },

    setIsoDate(utcDate) {
      this.sendAction('onPropositionsChange', this.get('positionInPropositions'), this.createPropositionChangeObj(moment(utcDate).toISOString()));
    },

    selectFromAutocomplete(selectedObject) {
      this.sendAction('onPropositionsChange', this.get('positionInPropositions'), this.createPropositionChangeObj(selectedObject));
    },

    searchAutocomplete(queryString) {
      return this.get('store').query('organization', { name: queryString }).then(results => {
        if (results.length) {
          return results.map(result => {
            return {
              value: result.get('id'),
              string: result.get('name')
            };
          });
        } else {
          return [];
        }
      });
    }
  }
});
