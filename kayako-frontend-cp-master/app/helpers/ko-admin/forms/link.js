import Helper from '@ember/component/helper';
import { htmlSafe } from '@ember/string';
import { inject as service } from '@ember/service';

export default Helper.extend({
  i18n: service(),

  compute([link, linkText]) {
    if (link) {
      const localizedLinkText = this.get('i18n').t(linkText);
      return htmlSafe(`<a href="${link}" target="_blank" rel="noopener noreferrer">${localizedLinkText}</a>`);
    } else {
      return '';
    }
  }
});
