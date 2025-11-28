import Component from '@ember/component';
import { computed } from '@ember/object';
import { guidFor } from '@ember/object/internals';
import { run, bind } from '@ember/runloop';
import { on } from '@ember/object/evented';
import $ from 'jquery';
import { variation } from 'ember-launch-darkly';
import styles from './styles';

const COLLAPSED_CC_LIMIT = 8;

export default Component.extend({
  tagName: 'div',

  // Attributes
  select: null,
  selected: null,
  onChange: () => {},
  onToggle: () => {},
  onCCInput: () => {},
  isActive: false,
  onSearch: null,

  state: null,
  hideToggleButton: false,

  focusInput(select) {
    $(`#${this.get('inputId')}`).focus();
  },

  handleOutsideClick(event) {
    if (variation('release-cc-list-improvements')) {
      const focusIsNotOnCCInput = document.activeElement.id !== this.get('inputId');
      const targetIsNotAChildElement = this.element && !this.element.contains(event.target);
      const isDeletedOptionItem = !document.body.contains(event.target) && $(event.target).parents(`.${styles['option-item']}`).length;

      if (!isDeletedOptionItem && focusIsNotOnCCInput && targetIsNotAChildElement) {
        // Handling Outside Clicks
        this.send('toggleCC', null);
      }
    } else {
      if (this.element && !this.element.contains(event.target)) {
        // Handling Outside Clicks
        this.send('toggleCC', null);
      }
    }
  },

  setupOutsideClickListener: on('didInsertElement', function() {
    this._clickHandler = bind(this, 'handleOutsideClick');
    return $(document).on('click', this._clickHandler);
  }),

  removeOutsideClickListener: on('willDestroyElement', function() {
    return $(document).off('click', this._clickHandler);
  }),

  // CPs
  inputId: computed(function() {
    return `ko-${guidFor(this)}`;
  }),

  viewableSelectedCCs: computed('selected', 'isActive', function () {
    if (this.get('isActive')) {
      return this.get('selected');
    }
    return this.get('selected').slice(0, COLLAPSED_CC_LIMIT);
  }),

  hiddenCCsCount: computed('selected', 'isActive', function () {
    if (this.get('isActive')) return 0;

    return this.get('selected.length') - COLLAPSED_CC_LIMIT;
  }),

  showExpandCCsButton: computed.gt('hiddenCCsCount', 0),

  actions: {
    toggleCC(e) {
      if (e) {
        e.preventDefault();
      }
      // Event is set to null when it's called through onOutsideClick
      if (this.get('isActive') || !e) {
        if (variation('release-cc-list-improvements')) {
          this.get('onToggle')(false);
          document.body.focus();  // Moving focus out of the input (if it was focused) for IE11 issues. [FT-1748; #2375]
        } else {
          if (!this.get('selected.length')) {
            this.get('onToggle')(false);
            document.body.focus();  // Moving focus out of the input (if it was focused) for IE11 issues. [FT-1748; #2375]
          }
        }
      } else {
        this.get('onToggle')(true);
        run.schedule('afterRender', this, this.focusInput);
      }
    },

    addUser(select) {
      select.actions.choose(select.searchText.trim());
      run.scheduleOnce('afterRender', () => {
        select.actions.search('');
        this.focusInput(select);
      });
    },

    onChange(emails, select) {
      this.get('onChange')(emails, select);
      run.scheduleOnce('afterRender', () => {
        this.focusInput(select);
      });
    },

    addImmediateCC(e, cc, select) {
      this.get('onChange')(this.get('selected').addObject(cc), select);
      run.scheduleOnce('afterRender', () => {
        this.focusInput(select);
      });
    },

    popCC(option) {
      this.get('onChange')(this.get('selected').removeObject(option));
    }
  }
});
