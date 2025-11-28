import { get } from '@ember/object';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { buildTreeFromList } from 'frontend-cp/components/ko-select/drill-down/component';

export default Component.extend({
  // Attributes
  title: null,
  options: null,
  value: null,
  isErrored: false,
  isEdited: false,
  isKREEdited: false,
  isDisabled: false,
  onValueChange: null,

  // HTML
  tagName: '',

  tree: computed('options', function() {
    const items = this.get('options').filter(option => option && get(option, 'value'));
    return buildTreeFromList(items, item => ({
      id: get(item, 'id'),
      value: get(item, 'value')
    }));
  })
});
