import { htmlSafe } from '@ember/string';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: '',

  // Attributes
  description: '',
  link: null,
  linkText: '',
  small: false,

  // Services
  i18n: service(),

  linkContents: computed('link', 'linkText', function () {
    const link = this.get('link');
    if (link) {
      const linkText = this.get('i18n').t(this.get('linkText'));
      return htmlSafe(`<a href="${link}" target="_blank" rel="noopener noreferrer">${linkText}</a>`);
    } else {
      return null;
    }
  })
});
