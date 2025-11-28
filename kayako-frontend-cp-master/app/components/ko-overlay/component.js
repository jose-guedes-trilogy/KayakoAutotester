import Component from '@ember/component';
import $ from 'jquery';

export default Component.extend({
  tagName: '',

  // Attributes
  qaClass: null,

  didInsertElement() {
    $('html').css('overflow', 'hidden');
  },

  didDestroyElement() {
    $('html').css('overflow', '');
  }
});
