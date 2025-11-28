import Component from '@ember/component';
import ENV from 'frontend-cp/config/environment';

export default Component.extend({
  tagName: '',

  didInsertElement() {
    this._super(...arguments);

    // Because headwayapp doesn't have any kind of API
    // there is no way how to re-initialize it, after
    // element was destroyed on the page. So when
    // notification badge is hidden because of search bar
    // we need to add it to the page again. And for it to
    // work completely, we need to remove their special key
    // HW_UID_<key> from window.

    let scriptTags = document.getElementsByTagName('script');

    Object.keys(window).forEach((key) => {
      if (key.match('HW_UID_')) {
        Reflect.deleteProperty(window, key);
      }
    });

    for (let i = 0, max = scriptTags.length; i < max; i++) {
      if (scriptTags[i] && scriptTags[i].src.match('headwayapp')) {
        scriptTags[i].parentNode.removeChild(scriptTags[i]);
      }
    }

    window.HW_config = {
      selector: '.ko-notification-badge',
      account: ENV.headAwayApp.key,
      enabled: true
    };

    let uv = document.createElement('script');
    uv.type = 'text/javascript';
    uv.async = true;
    uv.src = '//cdn.headwayapp.co/widget.js';
    let s = scriptTags[0];
    s.parentNode.insertBefore(uv, s);
  }
});
