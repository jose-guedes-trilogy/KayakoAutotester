import Component from '@ember/component';
import { task, timeout } from 'ember-concurrency';
import { computed } from '@ember/object';
import styles from './styles';

export default Component.extend({
  // Attributes
  large: false,
  delay: 500,
  overlay: false,

  // Available sizes: S, M, L
  size: 'S',

  // HTML
  tagName: '',

  showSpinner: true,

  didInsertElement() {
    this._super(...arguments);
    this.get('showSpinnerAfterDelay').perform();
  },

  showSpinnerAfterDelay: task(function * () {
    yield timeout(this.get('delay'));
    this.set('showSpinner', true);
  }),

  sizeClass: computed('size', 'large', function() {
    if (this.get('large') || this.get('size') === 'L') {
      return styles.containerLarge;
    } else if (this.get('size') === 'M') {
      return styles.containerMedium;
    }

    return styles.containerSmall;
  })
});
