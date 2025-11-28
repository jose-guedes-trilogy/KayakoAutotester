import Component from '@ember/component';
import diffAttrs from 'ember-diff-attrs';

export default Component.extend({
  tagName:'',

  key: null,
  shouldTrack: false,

  // appcues: service(),

  didReceiveAttrs: diffAttrs('shouldTrack', function(changedAttrs, ...args) {
    this._super(...args);
    if (!changedAttrs || this._changedFromFalseToTrue(changedAttrs.shouldTrack)) {
      this._trackEvent();
    }
  }),

  _trackEvent() {
    if (this.get('shouldTrack')) {
      // Commenting code to remove appcues dependency
      // this.get('appcues').track(this.get('key'));
    }
  },

  _changedFromFalseToTrue(shouldTrack) {
    if (!shouldTrack) {
      return false;
    }

    let [oldValue, newValue] = shouldTrack;

    return (oldValue === false) && (newValue === true);
  }
});
