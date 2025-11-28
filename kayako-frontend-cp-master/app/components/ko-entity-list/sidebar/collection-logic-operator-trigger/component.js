import Component from '@ember/component';
import * as KeyCodes from 'frontend-cp/lib/keycodes';

export default Component.extend({
  // Attributes
  select: null,

  // HTML
  tagName: '',

  actions: {
    handleMouseDown(e) {
      if (this.get('select.isOpen')) {
        e.stopPropagation();
      }
    },

    handleKeyDown(e) {
      let select = this.get('select');
      if (e.keyCode === KeyCodes.enter && select.isOpen) {
        select.actions.choose(select.highlighted, e);
        e.stopPropagation();
      }
      // Don't use space to select currently highlighed option
      if (e.keyCode === KeyCodes.space && select.isOpen) {
        e.stopPropagation();
      }
      if (!this.get('select.isOpen') && e.keyCode !== KeyCodes.tab && e.keyCode !== KeyCodes.enter) {
        e.preventDefault();
      }
    }
  }
});
