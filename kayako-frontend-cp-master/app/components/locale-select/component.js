import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import Component from '@ember/component';
import * as KeyCodes from 'frontend-cp/lib/keycodes';


export default Component.extend({
  store: service(),

  options: [],

  disabled: false,
  selected: null,
  onChange: null,

  selectedLocale: computed('options', 'selected', function () {
    const selectedOption = this.get('options').find(option => option.code === this.get('selected'));
    return selectedOption || null;
  }),

  init() {
    this._super(...arguments);
    const locales = this.get('store').peekAll('locale').filterBy('isPublic');
    const localeOptions = [];
    locales.forEach(element => {
      localeOptions.push({
        code: element.get('locale'), 
        language: element.get('name')
      });
    });
    this.set('options', localeOptions);
  },

  // Actions
  actions: {
    preventSubmissionOnEnter(_, e) {
      if (e.keyCode === KeyCodes.enter) {
        e.preventDefault();
      }
    }
  }
});
