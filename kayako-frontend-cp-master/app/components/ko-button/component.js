import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  // Attributes
  type: 'default', // [ default | naked | cancel | primary | primary-with-options | highlight | alert ]
  purpose: 'generic',
  href: null,
  target: null,
  rel: null,
  submit: false,
  disabled: false,
  qaClass: null,
  size: 'normal', // [ 'normal', 'medium' ]
  full: false,
  onClick: () => {}
});
