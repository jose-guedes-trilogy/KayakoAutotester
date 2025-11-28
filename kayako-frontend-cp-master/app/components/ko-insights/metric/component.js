import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { computed } from '@ember/object';
import styles from './styles';

export default Component.extend({
  i18n: service(),
  tagName: '',

  // Attributes
  isLoading: false,
  section: null,
  type: null,
  name: null,
  value: null,
  previous: null,
  delta: null,
  deltaInverted: false,
  first: false,

  deltaTooltip: computed('type', 'value', 'previous', function() {
    const type = this.get('type');
    const value = this.get('value');
    const previous = this.get('previous');

    const valueFormatted = type === 'number' ? this.get('i18n').formatNumber(value) : value;
    const previousFormatted = type === 'number' ? this.get('i18n').formatNumber(previous) : previous;

    return valueFormatted +
      ' ' +
      this.get('i18n').t('insights.insights.vs') +
      ' ' +
      (previousFormatted === null ? '-' : previousFormatted);
  }),

  deltaRounded: computed('delta', function() {
    return Math.round(this.get('delta'));
  }),

  triangleStyle: computed('deltaInverted', 'delta', function() {
    const delta = this.get('delta');
    const inverted = this.get('deltaInverted');

    if (delta > 0 && !inverted) {
      return styles.triangleUpPositive;
    } else if (delta < 0 && !inverted) {
      return styles.triangleDownNegative;
    } else if (delta > 0 && inverted) {
      return styles.triangleUpNegative;
    } else if (delta < 0 && inverted) {
      return styles.triangleDownPositive;
    }
  }),

  deltaStyle: computed('deltaInverted', 'delta', function() {
    const delta = this.get('delta');
    const inverted = this.get('deltaInverted');

    if (delta < 0 && !inverted || delta > 0 && inverted) {
      return styles.deltaNegative;
    }
  }),

  title: computed('name', function() {
    if (this.get('name')) {
      return this.get('i18n').t(`insights.metric.${this.get('name')}`);
    }

    return '';
  }),

  titleTooltip: computed('name', 'section', function() {
    if (this.get('name')) {
      return this.get('i18n').t(`insights.metric.tooltip.${this.get('section')}.${this.get('name')}`);
    }

    return '';
  })
});
