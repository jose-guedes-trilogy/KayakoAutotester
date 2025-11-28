import Component from '@ember/component';
import { computed } from '@ember/object';
import { htmlSafe } from '@ember/string';
import KeyboardShortcuts from 'ember-keyboard-shortcuts/mixins/component';

export default Component.extend(KeyboardShortcuts, {
  // Attributes
  imgSrc: null,

  tagName: '',

  // State
  showingLightbox: false,
  imgLoaded: false,

  // CPs
  imgStyle: computed('imgSrc', function() {
    return htmlSafe(`background-image: url("${this.get('imgSrc')}")`);
  }),

  keyboardShortcuts: {
    esc: function() { this.set('showingLightbox', false); }
  },

  actions: {
    toggleLightbox() {
      this.toggleProperty('showingLightbox');
    },

    onImageLoaded() {
      this.set('imgLoaded', true);
    }
  }
});
