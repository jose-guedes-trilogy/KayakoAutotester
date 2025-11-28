import Component from '@ember/component';
import { computed } from '@ember/object';
import { run } from '@ember/runloop';
import * as KeyCodes from 'frontend-cp/lib/keycodes';
import trimLeft from 'npm:string.prototype.trimleft';
import { isBlank } from '@ember/utils';
import fallbackIfUndefined from 'ember-basic-dropdown/utils/computed-fallback-if-undefined';

export default Component.extend({
  // Attributes
  allowCreate: false,
  allowDelete: true,
  allowAddDuringSearch: false,
  dropdownClass: null,
  extra: null,
  disabled: false,
  onChange: null,
  onValueAddition: null,
  onValueRemoval: null,
  onSuggestion: null,
  options: null,
  placeholder: '',
  searchField: 'name',
  triggerClass: null,
  renderInPlace: fallbackIfUndefined(true),
  verticalPosition: fallbackIfUndefined('auto'),
  selected: [],

  // HTML
  tagName: '',

  // CPs
  isEmpty: computed('onSuggestion', 'options', function() {
    return !this.get('onSuggestion') && !this.get('options');
  }),

  // Methods
  addValues(select, searchText) {
    const names = this.get('selected').mapBy(this.get('searchField')).map(name => name.toLowerCase());
    const newValues = searchText
      .split(' ')
      .map(name => name.trim().toLowerCase())
      .filter(name => name)
      .filter(name => !names.includes(name))
      .map(name => ({ [this.get('searchField')]: name }));

    newValues.forEach(value => select.actions.choose(value));

    run.scheduleOnce('afterRender', () => {
      select.actions.search('');
    });
  },

  actions: {
    createOnEnterOrTab(select, e) {
      if (select.highlighted) {
        if (e.keyCode === KeyCodes.tab) {
          select.actions.choose(select.highlighted, e);
        }
      } else if (!isBlank(select.searchText)) {
        if (e.keyCode === KeyCodes.enter) {
          if (select.loading && !this.get('allowAddDuringSearch')) { return false; }
          this.addValues(select, select.searchText);
          e.preventDefault();
          e.stopPropagation();
        } else if (e.keyCode === KeyCodes.tab) {
          this.addValues(select, select.searchText);
        }
      }
    },

    createOnCloseClickingOutside(select, e) {
      if (!e || e.type !== 'mousedown') { return; }
      if (!isBlank(select.searchText) && !select.loading) {
        this.addValues(select, select.searchText);
      }
    },

    closeIfEmpty(select) {
      // Here component acts as a freeform multi-value input
      if (this.get('isEmpty')) {
        return false;
      }
    },

    onSearch(searchText, select) {
      if (this.get('allowCreate') && trimLeft(searchText).includes(' ')) {
        this.addValues(select, searchText);
      } else if (this.get('onSuggestion')) {
        return this.get('onSuggestion')(searchText);
      }
    },

    setValue(newSelection) {
      const currentValues = this.get('selected');
      const valuesToAdd = newSelection.filter(value => currentValues.indexOf(value) === -1);
      const valuesToRemove = currentValues.filter(value => newSelection.indexOf(value) === -1);

      valuesToAdd.forEach(value => this.attrs.onValueAddition(value));
      valuesToRemove.forEach(value => this.attrs.onValueRemoval(value));
    }
  }
});
