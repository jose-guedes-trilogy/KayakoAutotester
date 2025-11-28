import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend({
  // Params
  user: null,
  isEdited: false,
  isErrored: false,
  isKREEdited: false,
  onChangeLocale: null,
  locale: null,
  isDisabled: false,

  store: service(),

  tagName: '',

  locales: computed(function() {
    return this.get('store').peekAll('locale').filterBy('isPublic');
  })

});
