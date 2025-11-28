import Component from '@ember/component';
import { inject as service } from '@ember/service';

import diffAttrs from 'ember-diff-attrs';
import { variation } from 'ember-launch-darkly';

import { DONK } from 'frontend-cp/services/sound-alerts';

export default Component.extend({
  tagName: '',

  soundAlerts: service(),
  window: service(),
  browserTab: service(),

  // Public API
  unreadCount: 0,

  // Internal State
  initialCount: 0,
  countText: null,

  init() {
    this._super(...arguments);
    this.set('initialCount', this.get('unreadCount'));
  },

  didReceiveAttrs: diffAttrs('unreadCount', function(changedAttrs, ...args) {
    this._super(...args);

    if (!changedAttrs || changedAttrs.unreadCount) {
      let count = this._calculateCount();

      if (count > 0) {
        let text = this._generateCountText(count);

        this.set('countText', text);

        if (variation('release-live-chat-notification-improvements')) {
          this.get('browserTab').registerAppUpdate();

          if (variation('ops-audible-reply-alert-only-when-browser-not-focussed')) {
            let windowIsFocussed = this.get('window.visible');

            if (!windowIsFocussed) {
              this._playSound();
            }
          } else {
            this._playSound();
          }
        }
      } else {
        this.set('countText', null);
      }
    }
  }),

  _calculateCount() {
    const count = this.get('unreadCount') - this.get('initialCount');
    return count < 0 ? 0 : count;
  },

  _generateCountText(count) {
    if (count > 9) {
      return '9+';
    } else {
      return count;
    }
  },

  _playSound() {
    return this.get('soundAlerts').play(DONK);
  }
});
