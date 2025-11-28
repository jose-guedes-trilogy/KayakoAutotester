import _ from 'npm:lodash';
import { sanitize } from 'ember-sanitize/utils/sanitize';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { get } from '@ember/object';
import { on } from '@ember/object/evented';
import { assign } from '@ember/polyfills';
import { task, timeout } from 'ember-concurrency';
const { map, groupBy, partition } = _;

export default Component.extend({
  tagName: '',

  // Attributes
  options: [],
  value: null,
  onValueChange: null,
  onTraversingItems: null,
  emptyLabel: null,
  hasEmptyOption: false,
  extra: null,
  triggerComponent: null,
  triggerClass: null,
  placeholder: null,
  searchPlaceholder: null,
  searchEnabled: false,
  searchField: 'value',
  isDisabled: false,
  showFullPathOnLeaves: false,
  dropdownClass: null,
  renderInPlace: false,
  matchTriggerWidth: true,
  tabIndex: 0,
  verticalPosition: 'auto',
  horizontalPosition: 'auto',
  noSanitize: false,

  // State
  currentPath: null,

  resetState: on('init', 'didReceiveAttrs', function () {
    this.set('currentPath', []);
  }),

  sanitizedOptions: computed('options.[]', function() {
    return this.get('options').map(({ id, value, object, children }) => {
      if (value && typeof value === 'string' && !this.get('noSanitize')) {
        value = sanitize(value);
      }
      return { id, value, object, children };
    });
  }),

  // CPs
  currentHierarchyLevel: computed('sanitizedOptions.[]', 'currentPath.[]', 'showFullPathOnLeaves', function () {
    const showFullPathOnLeaves = this.get('showFullPathOnLeaves');

    const find = (item, pathLeft, pathTraversed) => {
      if (pathLeft.length === 0) {
        const children = item.children.map(child => assign({}, child, {
          value: showFullPathOnLeaves ? pathTraversed.concat(child.value).join(' / ') : child.value,
          object: child.object,
          levelValue: get(child, 'value.text') || get(child, 'value')
        }));

        if (item.id) {
          return [{
            value: showFullPathOnLeaves ? pathTraversed.join(' / ') : item.value,
            object: item.object,
            levelValue: get(item, 'value.text') || get(item, 'value'),
            id: item.id
          }, ...children];
        } else {
          return children;
        }
      } else {
        return find(
          item.children.find(option => get(option, 'value') === pathLeft[0]),
          pathLeft.slice(1),
          [...pathTraversed, pathLeft[0]]
        );
      }
    };

    const items = find({ children: this.get('sanitizedOptions') }, this.get('currentPath'), []);
    if (this.get('hasEmptyOption') && this.get('currentPath').length === 0) {
      items.unshift({
        type: 'empty',
        value: this.get('emptyLabel') || '-'
      });
    }

    if (this.get('currentPath').length > 0) {
      items.unshift({
        type: 'back',
        value: 'Back'
      });
    }
    return items;
  }),

  flatOptions: computed('sanitizedOptions.[]', function () {
    const flatten = options => _.flatten(options.map(option => {
      let children = flatten(option.children || [])
        .map(item => ({ id: item.id, object: item.object, value: option.value + ' / ' + item.value }));
      if (option.id) {
        return [{ id: option.id, object: option.object, value: option.value }, ...children];
      } else {
        return children;
      }
    }));

    return flatten(this.get('sanitizedOptions'));
  }),

  // We can't listen for deeply nested changes in a data structure which can go
  // infinitely deep. Thus the implicit contract between this and parent is
  // immutability of `options`.
  formattedValue: computed('sanitizedOptions.[]', 'value', function () {
    const value = this.get('value');
    if (!value) {
      return this.get('emptyLabel') || '-';
    }

    const find = options => {
      let item = options.find(option => get(option, 'id') === value);
      if (item) {
        return [get(item, 'value')];
      } else {
        return options
          .filter(option => get(option, 'children'))
          .map(option => [get(option, 'value'), ...find(get(option, 'children'))])
          .find(option => option.length > 1) || [];
      }
    };

    return find(this.get('sanitizedOptions')).join(' / ');
  }),

  computedExtra: computed('extra', 'formattedValue', function () {
    return assign({}, this.get('extra') || {}, {
      labelPath: 'value',
      formattedValue: this.get('formattedValue')
    });
  }),

  search: task(function * (term) {
    yield timeout(300);
    const termLowerCase = term.toLowerCase();
    const matches = option => option.value.toLowerCase().indexOf(termLowerCase) !== -1;
    return this.get('flatOptions').filter(matches);
  }).restartable(),

  actions: {
    handleMouseDown(e) {
      e.preventDefault();
      e.stopPropagation();
    },

    selectItem(item, dropdown) {
      if (this.get('onTraversingItems')) {
        this.get('onTraversingItems')(item);
      }

      if (get(item, 'children.length')) {
        this.get('currentPath').pushObject(get(item, 'levelValue'));
      }
      else if (get(item, 'id')) {
        dropdown.actions.close();
        this.get('onValueChange')(item);
      }
      else if (get(item, 'type') === 'empty') {
        dropdown.actions.close();
        this.get('onValueChange')(null);
      }
      else if (get(item, 'type') === 'back') {
        this.get('currentPath').popObject();
      }
    },

    resetState() {
      this.resetState();
      if (this.get('onTraversingItems')) {
        this.get('onTraversingItems')(null);
      }
    }
  }
});

export function buildTreeFromList(list, cb) {
  let splitItems = list.map(cb).map(item => assign({}, item, {
    value: (item.value || '').split(/\\/).map(value => value.trim())
  }));

  const group = items =>
    map(
      groupBy(items, item => item.value[0]),
      (items, label) => {
        const [children, [current]] = partition(items, item => item.value.length > 1);

        return {
          id: current ? current.id : null,
          value: label.trim(),
          children: (children && children.length) ? group(children.map(item => ({
            id: item.id,
            value: item.value.slice(1),
            object: item.object
          }))) : null,
          object: current ? current.object : null
        };
      }
    );

  return group(splitItems);
}
