import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  // Attributes
  localeFields: null,
  inputType: 'text',

  // State
  defaultLocale: '',

  // HTML
  tagName: 'div',

  store: service(),

  // Lifecycle hooks
  init() {
    this._super(...arguments);
    let settings = this.get('store').peekAll('setting');
    this.set('defaultLocale', settings.findBy('key', 'account.default_language').get('value'));
  },

  // CPs
  hasMultipleLocales: computed('localeFields', function() {
    return this.get('localeFields').length > 1;
  }),

  translationsForField: computed('localeFields', function() {
    const locales = this.get('store').peekAll('locale');
    const localeFields = this.get('localeFields');

    return localeFields.filter(localeField => {
      const locale = locales.findBy('locale', localeField.get('locale'));
      return locale.get('isPublic') === true && localeField.get('locale') !== this.get('defaultLocale');
    });
  }),

  isEdited: computed('localeFields.@each.hasDirtyAttributes', 'localeFields.@each.translation', function() {
    const fieldLocales = this.get('translationsForField');
    const populatedFieldLocales = fieldLocales.find(fieldLocale => fieldLocale.get('translation'));

    return populatedFieldLocales && fieldLocales.isAny('hasDirtyAttributes', true);
  })
});
