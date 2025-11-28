import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  // HTML
  tagName: '',

  // Attributes
  option: null,
  isCaseField: null,

  // Services
  locale: service(),
  store: service(),

  // CPs
  valueLocale: computed('option.values.[]', 'locale.accountDefaultLocaleCode', function () {
    const values = this.get('option.values');
    return values.findBy('locale', this.get('locale.accountDefaultLocaleCode'));
  }),

  actions: {
    setTag(tagName) {
      this.set('option.tag', tagName);
    },
    setValue(translation) {
      const valueLocale = this.get('valueLocale');

      if (valueLocale) {
        valueLocale.set('translation', translation);
      }
    }
  }
});
