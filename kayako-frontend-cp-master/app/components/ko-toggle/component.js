import Component from '@ember/component';
import * as KeyCodes from 'frontend-cp/lib/keycodes';
import WithUniqueId from 'frontend-cp/mixins/with-unique-id';

export default Component.extend(WithUniqueId, {
  tagName: '',

  // Attributes
  label: '',
  qaClass: null,
  activated: null,
  onToggle: null,
  isDisabled: false,

  // Lifecycle hooks
  init() {
    this._super(...arguments);
    if (!this.get('activated')) {
      this.set('activated', false);
    }
  },

  // Actions
  actions: {
    keyDown(e) {
      if (e.keyCode === KeyCodes.space) {
        return false;
      }
    },

    keyUp(e) {
      if (e.keyCode === KeyCodes.space) {
        this.send('toggleRadio');
      }
      return false;
    },

    toggleRadio() {
      if (this.get('isDisabled')) {
        return;
      } else if (this.onToggle) {
        this.sendAction('onToggle', !this.get('activated'));
      } else {
        this.toggleProperty('activated');
      }
    }
  }
});
