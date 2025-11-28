import Component from '@ember/component';

export default Component.extend({
  tagName: 'input',
  attributeBindings: ['type', 'multiple', 'disabled', 'title', 'accept'],
  type: 'file',
  multiple: true,
  change() {
    let files = this.element.files;
    this.sendAction('on-change', Array.slice(files));
  }
});
