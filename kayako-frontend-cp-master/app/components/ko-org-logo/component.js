import Component from '@ember/component';
import { computed } from '@ember/object';
import { isRetina } from 'frontend-cp/utils/platform';

export default Component.extend({
  tagName: 'span',

  // Attributes
  size: 42,
  greyscale: false,
  org: null,
  domain: null,
  src: null,

  // CPs
  // Accepts a string, domain model object, or an org for computing a domain.
  computedDomain: computed.or('domain', 'domain.domain', 'org.domains.firstObject.domain'),

  imageSize: computed('size', function() {
    return isRetina ? this.get('size') * 2 : this.get('size');
  }),

  computedSrc: computed('computedDomain', 'size', 'imageSize', 'greyscale', function () {
    let computedDomain = this.get('computedDomain');
    let imageSize = this.get('imageSize');
    let size = this.get('size');
    let greyscale = this.get('greyscale');
    return `//logo.clearbit.com/${computedDomain}?size=${imageSize || size}${greyscale ? '&greyscale=true' : ''}`;
  }),

  actions: {
    replaceSrc() {
      if (this.isDestroyed || this.isDestroying) { return; }
      if (this.get('size') <= 20) {
        this.set('src', '/images/inline-icons/icon--org.svg');
      }
      else {
        this.set('src', '/images/inline-icons/icon--org--32.svg');
      }
    }
  }
});
