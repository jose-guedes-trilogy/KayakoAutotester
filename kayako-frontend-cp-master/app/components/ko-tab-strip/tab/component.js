import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  tab: null,
  qaClass: null,
  'on-close': () => {},

  init() {
    this._super(...arguments);

    let tab = this.get('tab');

    if (!tab) {
      throw new Error('Must provide a tab');
    }
  }
});
