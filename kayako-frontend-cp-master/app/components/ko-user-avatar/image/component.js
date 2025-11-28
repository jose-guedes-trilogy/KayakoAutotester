import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  url: '',
  size: 'normal',
  type: 'square',

  _isImageLoaded: false,

  imageDidLoad() {
    if (this.get('isDestroying') || this.get('isDestroyed')) { return; }
    this.set('_isImageLoaded', true);
  },

  avatarSizeClass: computed('size', function() {
    switch (this.get('size')) {
      case 'nano': return 'sizeNano';
      case 'micro': return 'sizeMicro';
      case 'small': return 'sizeSmall';
      case 'submedium': return 'sizeSubmedium';
      case 'medium': return 'sizeMedium';
      case 'large': return 'sizeLarge';
      case 'xLarge': return 'sizeXLarge';
    }
  }),

  isRound: computed('type', function() {
    return this.get('type') === 'round';
  })
});
