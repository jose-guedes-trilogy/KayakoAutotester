import { isBlank } from '@ember/utils';
import { set, computed } from '@ember/object';
import BaseComponent from '../base/component';

export default BaseComponent.extend({
  // Lifecycle hooks
  init() {
    this._super(...arguments);
    this.originalValue = this.get('automationAction.value');
  },

  // CPs
  payloadFormat: computed('automationAction.value', {
    get() {
      return isBlank(this.get('automationAction.value')) ? 'simple' : 'custom';
    },
    set(_, v) {
      if (v === 'custom') {
        this.set('automationAction.value', this.originalValue || '{"": ""}');
      } else if (v === 'simple') {
        this.originalValue = this.get('automationAction.value');
        this.set('automationAction.value', '');
      }
      return v;
    }
  }),

  parameters: computed('automationAction.value', {
    get() {
      let val = this.get('automationAction.value');
      let parameters = [];

      try {
        let object = JSON.parse(val);
        Object.keys(object).forEach(name => parameters.push({ name, value: object[name] }));
      } catch (jsonParseError) {
        parameters.push({ name: null, value: null });
      }
      return parameters;
    },
    set(_, v) {
      this.set('automationAction.value', this.serializeParameters(v));
      return v;
    }
  }),

  // Actions
  actions: {
    addParameter() {
      let parameters = this.get('parameters');
      if (parameters.some(param => isBlank(param.name))) { return; }
      this.set('parameters', parameters.concat([{ name: '', value: '' }]));
    },

    removeParameter(pair) {
      let newParameters = this.get('parameters').filter(obj => obj !== pair);
      this.set('parameters', newParameters);
    },

    updatePair(pair, attr, e) {
      set(pair, attr, e.target.value);
      this.set('parameters', this.get('parameters'));
    }
  },

  // Methods
  serializeParameters(parameters) {
    let obj = parameters.reduce((accum, param) => {
      accum[param.name] = param.value;
      return accum;
    }, {});
    return JSON.stringify(obj);
  }
});
