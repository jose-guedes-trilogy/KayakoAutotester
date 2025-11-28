import Component from '@ember/component';
import { computed } from '@ember/object';

// hack for now - in future it'll just be type "app" and
// the path will be a separate field
const APP_TYPE_REGEX = /^app:(.*)$/;

export default Component.extend({
  tagName: '',

  prompt: null,
  app: null,

  inputType: computed('prompt.inputType', function() {
    const type = this.get('prompt.inputType');

    const appMatch = type.match(APP_TYPE_REGEX);
    if (appMatch) {
      return 'app';
    } else {
      return type;
    }
  }),

  appURL: computed('prompt.inputType', 'app.slots.firstObject', function() {
    const type = this.get('prompt.inputType');
    const appMatch = type.match(APP_TYPE_REGEX);
    if (!appMatch) {
      return;
    }

    const path = appMatch[1];
    const url  = this.get('app.slots.firstObject.url');

    // we know that the URL will be of the form https://foo.cdn.net/${app-name}/${version}/${path/to/index.html}
    const prefixMatch = url.match(/^(https:\/\/[^/]+\/[^/]+\/[^/]+\/)/);
    if (!prefixMatch) {
      return;
    }

    const prefix = prefixMatch[1];
    return `${prefix}${path}`;
  })

});
