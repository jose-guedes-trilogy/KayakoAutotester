import KeyboardShortcuts from 'ember-keyboard-shortcuts/mixins/component';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { htmlSafe } from '@ember/string';

export default Component.extend(KeyboardShortcuts, {
  tagName: '',

  // Attributes
  width: '720px',
  showHeader: true,
  chromelessContent: false,
  qaClass: null,
  'on-close': null,
  'on-confirm': null,
  noHeaderContent: false,
  noFooter: false,
  borderTop: true,
  borderBottom: true,
  showCloseButton: true,
  enableEscClose: true,

  keyboardShortcuts: {
    esc: function() {
      if (this.get('enableEscClose')) {
        let closeAction = this.get('on-close');
        closeAction && closeAction();
      }
    },

    enter: function() {
      let confirmAction = this.get('on-confirm');
      confirmAction && confirmAction();
    }
  },

  // CPs
  modalStyle: computed('width', function () {
    return htmlSafe(`width: ${this.get('width')}`);
  })
});
