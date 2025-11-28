import Component from '@ember/component';
import { get, computed } from '@ember/object';
import WithUniqueId from 'frontend-cp/mixins/with-unique-id';

export default Component.extend(WithUniqueId, {
  // Attributes
  title: '',
  value: null,
  options: [],
  onValueChange: null,
  labelPath: null,
  idPath: null,
  isErrored: false,
  isEdited: false,
  isKREEdited: false,
  isDisabled: false,
  hasEmptyOption: true,
  showBottomArrow: false,
  searchPlaceholder: null,
  qaClass: null,
  search: null,
  emptyLabel: null,

  // HTML
  tagName: '',

  // CPs
  normalizedOptions: computed('hasEmptyOption', 'labelPath', 'options.[]', 'emptyLabel', function() {
    let opts = this.get('options').toArray();
    if (this.get('hasEmptyOption')) {
      let labelPath = this.get('labelPath');
      let emptyOpt;
      if (labelPath) {
        emptyOpt = { id: '__empty_option__' };
        emptyOpt[labelPath] = this.get('emptyLabel') || '-';
      } else {
        emptyOpt = this.get('emptyLabel') || '-';
      }
      opts.unshift(emptyOpt);
    }
    return opts;
  }),

  normalizedValue: computed('idPath', 'value', 'normalizedOptions.[]', function () {
    const idPath = this.get('idPath');
    const value = this.get('value');
    if (idPath && value) {
      return this.get('normalizedOptions').findBy(idPath, value);
    } else if (idPath) {
      return this.get('normalizedOptions').findBy(idPath, '__empty_option__');
    } else {
      return value;
    }
  }),

  // Actions
  actions: {
    selectItem(item) {
      let normalizedItem = item;
      if (this.get('labelPath')) {
        if (!item || item.id === '__empty_option__') {
          normalizedItem = null;
        }
      } else if (item === this.get('emptyLabel')) {
        normalizedItem = null;
      }
      const action = this.get('onValueChange');
      let idPath = this.get('idPath');
      if (idPath) {
        action(normalizedItem && get(normalizedItem, idPath));
      } else {
        action(normalizedItem);
      }
    }
  }
});
