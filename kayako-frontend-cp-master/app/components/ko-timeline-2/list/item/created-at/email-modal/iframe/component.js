import Component from '@ember/component';
import { guidFor } from '@ember/object/internals';
import { computed } from '@ember/object';
import jQuery from 'jquery';
import { run } from '@ember/runloop';

export default Component.extend({
  tagName: '',

  content: null,
  qaClass: null,

  eid: computed(function() {
    return `ko-${guidFor(this)}`;
  }),

  didInsertElement() {
    this._super(...arguments);

    run.next(() => {
      let content = this.get('content');

      if (content) {
        this._updateContent(this._convertEmailAddressesInAngleBracketsToValidHtml(content));
        this._updateStyling();
      }
    });
  },

  _convertEmailAddressesInAngleBracketsToValidHtml(content) {
    return content.replace(/<.+?>/g, (substring) => {
      if (substring.includes('@')) {
        return substring.replace('<', '&lt').replace('>', '&gt');
      } else {
        return substring;
      }
    });
  },

  _updateContent(content) {
    let doc = jQuery(`#${this.get('eid')}`)[0].contentDocument;
    doc.open();
    doc.write('<!DOCTYPE html>');
    doc.write(content);
    doc.close();
  },

  _updateStyling() {
    let styles = `
    <style type="text/css">
      body {
        color: #5F6C73;
        font-family: sans-serif;
        font-size: 14px;
        line-height: 1.6;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      a {
        color: #42aac8;
        text-decoration: none;
      }

      a:hover {
        color: #3496b2;
      }
    </style>
    `;

    let head = jQuery(`#${this.get('eid')}`)[0].contentDocument.head;

    jQuery(head).prepend(styles);
  }
});
