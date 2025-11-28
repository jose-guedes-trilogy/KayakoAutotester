import Component from '@ember/component';
import { run } from '@ember/runloop';
import $ from 'jquery';

export default Component.extend({
  didInsertElement() {
    this._focusToken = run.later(() => $(`#${this.get('uniqueId')}`).focus(), 200);
  },

  willDestroyElement() {
    run.cancel(this._focusToken);
  }
});
