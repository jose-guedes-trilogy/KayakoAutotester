import CookiesService from 'ember-cookies/services/cookies';
import { A } from '@ember/array';
import { isEmpty } from '@ember/utils';
import { computed } from '@ember/object';

export default CookiesService.extend({
  _documentCookies: computed(function() {
    let all = this.get('_document.cookie').split(';');

    return A(all).reduce((acc, cookie) => {
      if (!isEmpty(cookie)) {
        let [key, value] = cookie.split('=');
        if (value.trim()) { // FT-1143 skip blank cookie values
          acc[key.trim()] = value.trim();
        }
      }
      return acc;
    }, {});
  }).volatile()

});
