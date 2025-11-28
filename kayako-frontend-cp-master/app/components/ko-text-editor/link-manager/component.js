import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  onAddLink: () => {},
  onCancel: () => {},

  url: '',
  text: '',

  init() {
    this._super(...arguments);
    this.set('text', this.get('editor').selection.text());
  }
});
