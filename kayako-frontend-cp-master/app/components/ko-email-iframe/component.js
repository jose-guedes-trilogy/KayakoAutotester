import Component from '@ember/component';
import { guidFor } from '@ember/object/internals';
import { computed } from '@ember/object';
import jQuery from 'jquery';
import { run } from '@ember/runloop';
import { scheduleOnce } from '@ember/runloop';
import { debounce } from '@ember/runloop';
import ResizeAware from 'ember-resize/mixins/resize-aware';

const RESIZE_DEBOUNCE_INTERVAL = 100;

export default Component.extend(ResizeAware, {
  tagName: '',

  content: null,
  qaClass: null,
  height: null,

  eid: computed(function() {
    return `ko-${guidFor(this)}`;
  }),

  didReceiveAttrs() {
    this._super(...arguments);

    run.next(() => {
      let content = this.get('content');

      if (content) {
        this._updateContent(content);
        this._handleIframeResize();
      }
    });
    scheduleOnce('afterRender', this, '_handleIframeResize', 50);
  },

  didResize() {
    debounce(this, '_handleIframeResize', RESIZE_DEBOUNCE_INTERVAL);
  },

  actions: {
    iframeLoaded() {
      run.next(() => {
        this._handleIframeResize();
      });
    }
  },

  _updateContent(content) {
    let doc = jQuery(`#${this.get('eid')}`)[0].contentDocument;
    doc.open();
    doc.write(`
      <base target="_blank">
      <!DOCTYPE html>
      ${content}
    `);
    doc.close();
  },

  _handleIframeResize() {
    if (this.get('isDestroyed') || this.get('isDestroying')) {
      return;
    }

    let $iframe = jQuery(`#${this.get('eid')}`)[0];

    if ($iframe) {
      let doc = $iframe.contentDocument;
      this.set('height', doc.body.scrollHeight + 10);
      this.set('width', doc.body.scrollWidth + 20);
    }
  }
});
