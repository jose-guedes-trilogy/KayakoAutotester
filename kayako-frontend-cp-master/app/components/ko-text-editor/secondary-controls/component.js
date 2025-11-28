import Component from '@ember/component';
import { computed } from '@ember/object';
import styles from './styles';

export default Component.extend({
  tagName: '',
  isInsideDropdown: false,
  isButtonOutdentDisabled: false,
  onTriggerControl: () => {},

  itemClass: computed('isInsideDropdown', function() {
    if (this.get('isInsideDropdown')) {
      return styles.buttonsDropdownItem;
    }
    return `${styles.item} ${styles.itemWrap} ${styles.itemSecondary}`;
  })
});
