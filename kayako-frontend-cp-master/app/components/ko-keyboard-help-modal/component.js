import Component from '@ember/component';
import { computed } from '@ember/object';
import { isMac } from 'frontend-cp/utils/platform';

export default Component.extend({
  tagName: '',

  cmdKey: computed(function() {
    return isMac() ? '⌘' : 'ctrl';
  }),

  shiftKey: computed(function() {
    return isMac() ? '⇧' : 'shift';
  }),

  altKey: computed(function() {
    return isMac() ? '⌥' : 'alt';
  })

});
