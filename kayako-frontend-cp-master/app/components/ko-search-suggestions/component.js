import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
  // Attributes:
  activePage: null,
  target: null,

  tagName: '',

  searchSuggestions: service(),

  didReceiveAttrs() {
    this._super(...arguments);
    this.get('searchSuggestions').setRoot(this.get('activePage'), this.get('target'));
  },

  willDestroyElement() {
    this.get('searchSuggestions').clearRoute();
  }
});
