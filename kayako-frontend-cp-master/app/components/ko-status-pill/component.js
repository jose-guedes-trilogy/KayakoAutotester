import Component from '@ember/component';
import { computed } from '@ember/object';
import styles from './styles';

export default Component.extend({
  tagName: '',

  type: null,
  label: null,

  statusClass: computed('type', function() {
    if (!this.get('type')) {
      return null;
    }

    return styles[`status-${this.get('type').toLowerCase()}`];
  })
});
