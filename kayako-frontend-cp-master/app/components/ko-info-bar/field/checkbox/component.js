import Component from '@ember/component';
import { computed } from '@ember/object';
import _ from 'npm:lodash';
import { inject as service } from '@ember/service';

let valueToArray = (value) => {
  return (value || '').split(',').filter((v) => v !== '');
};

export default Component.extend({
  tagName: '',

  // Params
  title: '',
  options: null,
  isErrored: false,
  isEdited: false,
  isKREEdited: false,
  isDisabled: false,
  value: null,
  onValueChange: null,
  hasUnsetOption: false,
  dropdownIsOpen: false,

  i18n: service(),

  isChecked(value, id) {
    return valueToArray(value).includes(id.toString());
  },

  displayValue: computed('value', 'dropdownIsOpen', function() {
    let value = this.get('value');
    let options = this.get('options');

    if (value === null) {
      return this.get('i18n').t('generic.no_changes');
    }
    if (value === '') {
      return this.get('i18n').t('cases.options_will_be_deselected', { count: options.length });
    }
    if (value && typeof value === 'string') {
      if (this.get('dropdownIsOpen')) {
        const count = value.split(',').length;
        if (count === options.length) {
          return this.get('i18n').t('cases.all_options_will_be_selected');
        }
        return this.get('i18n').t('cases.options_will_be_selected', { count: value.split(',').length });
      }
      return value
        .split(',')
        .map(id => options.findBy('id', id))
        .compact()
        .mapBy('value')
        .join(', ');
    }
  }),

  reset(close) {
    this.sendAction('onValueChange', null);
    close();
  },

  actions: {
    valueChanged(id, checked) {
      let valueAsArray = valueToArray(_.clone(this.get('value')));

      if (valueAsArray.includes(id)) {
        valueAsArray.removeObject(id);
      } else {
        valueAsArray.addObject(id);
      }

      let newValue = valueAsArray.join(',');

      this.sendAction('onValueChange', newValue);
    },

    toggleDropdown(isOpen) {
      if (isOpen && this.get('value') === null) {
        this.sendAction('onValueChange', '');
      }
      this.set('dropdownIsOpen', isOpen);
    }
  }
});
