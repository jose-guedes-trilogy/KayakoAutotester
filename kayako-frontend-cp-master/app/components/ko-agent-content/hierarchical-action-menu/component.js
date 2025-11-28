import Component from '@ember/component';
import _ from 'npm:lodash';
import diffAttrs from 'ember-diff-attrs';


export default Component.extend({
  items: null,
  currentItem: null,
  navigableItems: [],

  didReceiveAttrs: diffAttrs('items', 'currentItem', function(changedAttrs, ...args) {
    const currentMenuItemHasNoChildren = !this.get('currentItem.children.length');
    const navigableItemsHaveUpdated = !_.isEqual(this.get('navigableItems'), this.get('items'));
    if (currentMenuItemHasNoChildren && navigableItemsHaveUpdated) {
      this.set('navigableItems', this.get('items'));
    }
  }),

  actions: {
    itemSelected({ object: { action, args = [] } }) {
      if (action) {
        if (typeof action === 'function') {
          action(...args);
        } else if (typeof action === 'object' && typeof action.send === 'function') {
          action.send(...args);
        }
      }
    },
    traversingItems(currentItem) {
      this.set('currentItem', currentItem);
    }
  }
});
