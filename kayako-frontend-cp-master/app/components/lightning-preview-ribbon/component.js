import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  config: service(),
  cookies: service(),

  previewVersion: computed(function() {
    return this.get('cookies').read(this._cookieName());
  }).volatile(),

  _cookieName() {
    return this.get('config.lightningVersionCookieName');
  },

  actions: {
    clearCookieAndReloadBrowser(e) {
      e.preventDefault();

      this.get('cookies').clear(this._cookieName(), { path: '/' });

      window.location.reload(true);
    }
  }
});
