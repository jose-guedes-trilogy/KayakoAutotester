import Component from '@ember/component';
import * as KeyCodes from 'frontend-cp/lib/keycodes';
import WithUniqueId from 'frontend-cp/mixins/with-unique-id';

export default Component.extend(WithUniqueId, {
  isVerticallyCentered: false,
  isTopAligned: false,
  disabled: false,
  /**
   * size
   * @type Boolean
   * @values small | large \ null (default)
   *
   * @small 12px with 1px border
   * @null  14px with 1px border
   * @large 18px with 1px border
   */
  size: null,
  checked: false,
  tabindex: 0,
  label: '',
  tagName: '',
  qaClass: '',

  // Actions
  actions: {
    toggleCheckbox(event) {
      if (!this.disabled) {
        if (this.get('onCheck')) {
          this.sendAction('onCheck', !this.get('checked'), event);
        } else {
          this.toggleProperty('checked');
        }
      }
    },

    keyDown(e = {}) {
      if (e.keyCode === KeyCodes.space) {
        return false;
      }
    },

    keyUp(e = {}) {
      if (e.keyCode === KeyCodes.space) {
        this.send('toggleCheckbox');
      }
      return false;
    },

    click(e = {}) {
      e.stopPropagation && e.stopPropagation();

      return false;
    }
  }
});
