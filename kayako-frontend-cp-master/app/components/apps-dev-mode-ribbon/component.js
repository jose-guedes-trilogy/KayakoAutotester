import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: '',

  apps: service(),

  actions: {
    exitDevMode(e) {
      e.preventDefault();
      window.location = window.location.pathname; // reload and strip any query params
    }
  }
});
