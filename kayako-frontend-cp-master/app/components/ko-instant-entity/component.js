import $ from 'jquery';
import { on } from '@ember/object/evented';
import Component from '@ember/component';
import { scheduleOnce } from '@ember/runloop';
import { task } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { or, bool, equal, reads } from '@ember/object/computed';
import KeyboardShortcuts from 'ember-keyboard-shortcuts/mixins/component';
import { observer } from '@ember/object';
import { get } from '@ember/object';
import * as KeyCodes from 'frontend-cp/lib/keycodes';
import {
  validateTwitterHandleFormat as isTwitterHandle,
  validateEmailFormat as isValidEmail
} from 'frontend-cp/utils/format-validations';
import itemStyles from 'frontend-cp/components/ko-instant-entity/item/styles';
import styles from './styles';

/**
 * @Documentation for ko-instant-entity
 *
 * Required attributes:
 * instantEntityTerm, instantEntityResults, isProcessRunning, action: These two allow data-binding between the component and container.
 *
 * Optional Attributes:
 * mode, cancelAction, limit, forceFocus: The component works just fine without them.
 *
 * @instantEntityTerm: The search term.
 * @instantEntityResults: The displayed results, 3 at a time by default.
 * @isProcessRunning: Binds the loading event when you're creating a user or an organization in the components container.
 * @action: Returns the result object that the component searched for. Can be an entity (model) or a string (instantEntityTerm).
 *
 * @mode: 'user' (default) or 'organization'. Determines what will be searched for, results template format, and placeholder text.
 * @cancelAction: Allows going back from the instant-entity view by offering a cancel element. cancelAction needs to be handled in the container's JS.
 * @limit: To be set when more than 3 results are desired. Results are scrollable.
 * @forceFocus: When KIE needs to be focused even if focus exists on other contentEditable elements.
 * @isCase: When KIE is in a case based view.
 * @keyboardAction: Execute KIE keyboard event handlers in container views.
 */

export default Component.extend(KeyboardShortcuts, {
  // Attributes
  instantEntityTerm: '',
  instantEntityResults: null,
  actionTriggered: false,
  isProcessRunning: false,
  forceFocus: false,
  action: null,
  limit: 20,
  isCase: false,
  qaClass: null,

  /**
   * Type: Function
   */
  keyboardAction: null,
  cancelAction: null,

  /**
   * Type: String
   * Acceptable values: user | organization
   * Default: user
   */
  mode: 'user',
  disablePointer: false,
  isInputDirty: false,
  pointerLocation: {
    x: -1,
    y: -1
  },
  keyboardShortcuts: {
    esc: {
      action: 'triggerCancelAction',
      global: true,
      scoped: true,
      preventDefault: true
    }
  },

  // Services
  store: service(),
  i18n: service(),
  tabStore: service(),

  // Hooks
  didRender () {
    this.focusInstantSearch();
    this.focusFirstResultIfNoneFocused();
  },

  didReceiveAttrs () {
    this._super(...arguments);
  },

  tabChanged: observer('tabStore.activeTab.basePath', 'currentPath', function () {
    this.focusInstantSearch();
  }),

  // CPs
  inUserMode: equal('mode', 'user'),

  pointerDisabled: bool('disablePointer'),

  cancellable: bool('cancelAction'),

  showAddOption: computed('inUserMode', 'resultIsSameAsTerm', 'isInstantLoadRunning', 'isValidInstantEntityTerm', function () {
    const inUserMode = this.get('inUserMode');
    const resultIsSameAsTerm = this.get('resultIsSameAsTerm');
    const isInstantLoadRunning = this.get('isInstantLoadRunning');
    const isValidInstantEntityTerm = this.get('isValidInstantEntityTerm');

    let term = this.get('instantEntityTerm');
    const isEmail = isValidEmail(term);

    const ifTermIsValidWhileResultsAreNotLoading = isValidInstantEntityTerm && !isInstantLoadRunning;
    const ifOrgDoesNotExistInOrgMode = !inUserMode && !resultIsSameAsTerm;
    const ifUserDoesNotExistInUserMode = inUserMode && !resultIsSameAsTerm && isEmail;
    const entityDoesNotExist = ifOrgDoesNotExistInOrgMode || ifUserDoesNotExistInUserMode;

    return ifTermIsValidWhileResultsAreNotLoading && entityDoesNotExist;
  }),

  isInstantLoadRunning: or('loadInstantUsers.isRunning', 'loadInstantOrgs.isRunning'),

  invalidState: computed('isValidInstantEntityTerm', 'showAddOption', 'instantEntityResults', 'isInstantLoadRunning', function () {
    const isValidTerm = this.get('isValidInstantEntityTerm');
    const showAddOption = this.get('showAddOption');
    const isInstantLoadRunning = this.get('isInstantLoadRunning');
    const hasResults = Boolean(this.get('instantEntityResults.length'));

    if (!isValidTerm || isInstantLoadRunning) {
      return false;
    }
    else {
      return !showAddOption && !hasResults;
    }
  }),

  currentPath: reads('tabStore.activeTab.basePath'),

  resultIsSameAsTerm: computed('instantEntityTerm', 'instantEntityResults', function () {
    let term = this.get('instantEntityTerm').toLowerCase();

    let results = this.get('instantEntityResults');

    if (results) {
      if (this.get('inUserMode')) {
        let emails = results.getEach('primaryEmailAddress').compact().map((email) => email.toLowerCase()).includes(term);
        let twitter = results.getEach('primaryTwitterHandle').compact().map((handle) => handle.toLowerCase()).includes(term.slice(1));

        return emails || twitter;
      }
      else {
        return results.getEach('name').compact().map((name) => name.toLowerCase()).includes(term);
      }
    }
    else {
      return false;
    }
  }),

  isValidInstantEntityTerm: computed('instantEntityTerm', function () {
    return this.get('instantEntityTerm').trim().length > 2;
  }),

  // Tasks
  loadInstantUsers: task(function * (term) {
    let results = yield this.get('store').query('search-result', {
      query: `in:users ${term}`,
      include: '*',
      offset: 0,
      limit: this.get('limit')
    });

    return results.mapBy('resultData');
  }).restartable(),

  loadInstantOrgs: task(function * (term) {
    let results = yield this.get('store').query('search-result', {
      query: `in:organizations ${term}`,
      include: '*',
      offset: 0,
      limit: this.get('limit')
    });

    return results.mapBy('resultData');
  }).restartable(),

  onOutsideClick: function() {
    if ((this.get('cancelAction'))) {
      this.send('triggerCancelAction');
    }
  },

  handleOutsideClick: function(event) {
    let $element = this.$();
    let $target = $(event.target);

    if (!$target.closest($element).length) {
      this.onOutsideClick();
    }
  },

  setupOutsideClickListener: on('didInsertElement', function() {
    let clickHandler = this.get('handleOutsideClick').bind(this);

    return $(document).on('click.kie', clickHandler);
  }),

  removeOutsideClickListener: on('willDestroyElement', function() {
    return $(document).off('click.kie');
  }),

  findAndFocusOnInstantSearchBar() {
    if (this.isDestroying || this.isDestroyed) { return; }

    let el = document.activeElement;
    let isCurrentElementEditable = el && (el.isContentEditable || el.tagName.toUpperCase() === 'INPUT' || el.tagName.toUpperCase() === 'TEXTAREA');
    // In case the target is removed from the DOM, the focus would go back to the last element, which maybe editable.
    // We don't want that to prevent focus from getting to KIE.
    if (!isCurrentElementEditable || this.get('forceFocus')) {
      $(`#${this.get('elementId')}-instant-input`).focus();
    }
  },

  focusInstantSearch () {
    scheduleOnce('afterRender', this, 'findAndFocusOnInstantSearchBar');
  },

  focusFirstResultIfNoneFocused() {
    let list = this.$(`.${styles['instant-entity-list']}`);
    let focused = list.find(this.$(`.${itemStyles['instant-entity']}.${itemStyles.focused}`));

    if (focused.length === 0) {
      $(list.find(`.${itemStyles['instant-entity']}`)[0]).addClass(itemStyles.focused);
    }
  },

  scrollToItemIfOutOfView(item, e) {
    let parent = this.$(item).parent();
    let child = this.$(item);

    let parentBox = parent[0].getBoundingClientRect();
    let childBox = child[0].getBoundingClientRect();

    if (!this.get('disablePointer')) {
      this.set('disablePointer', true);
    }
    if (parentBox.bottom < childBox.bottom) {
      parent.scrollTop(parent.scrollTop() + childBox.bottom - parentBox.bottom);
    }

    if (childBox.top < parentBox.top) {
      parent.scrollTop(parent.scrollTop() + childBox.top - parentBox.top);
    }
  },

  actions: {
    triggerCancelAction() {
      if (this.get('cancelAction')) {
        this.sendAction('cancelAction');
      }
      else {
        this.set('instantEntityTerm', '');
        this.set('instantEntityResults', null);
        $(`#${this.get('elementId')}-instant-input`).val('');
      }
    },

    instantUserSearch(value) {
      value = value.trim();

      this.set('instantEntityTerm', value);

      if (isTwitterHandle(value)) {
        value = value.slice(1);
      }

      if (this.get('isValidInstantEntityTerm')) {
        this.get('loadInstantUsers').perform(value)
          .then(results => {
            if (this.get('isCase')) {
              results = results.filter(result => get(result, 'isEnabled') === true);
            }
            this.set('instantEntityResults', results);
          })
          .catch(() => { /* Catch TaskCancellation Error*/ });
      }
      else {
        this.set('instantEntityTerm', '');
        this.set('instantEntityResults', null);
      }
    },

    instantOrgSearch(value) {
      value = value.trim();

      this.set('instantEntityTerm', value);

      if (this.get('isValidInstantEntityTerm')) {
        this.get('loadInstantOrgs').perform(value)
          .then((results) => this.set('instantEntityResults', results))
          .catch(() => { /* Catch TaskCancellation Error*/ });
      }
      else {
        this.set('instantEntityTerm', '');
        this.set('instantEntityResults', null);
      }
    },

    handleInstantUserSearchKeypress(val, event) {
      this.set('isInputDirty', true);
      if (event.keyCode === KeyCodes.up || event.keyCode === KeyCodes.down || event.keyCode === KeyCodes.enter || event.keyCode === KeyCodes.tab) {
        event.preventDefault();
      }

      if (event.keyCode === KeyCodes.tab) {
        if (this.get('keyboardAction')) {
          this.send('triggerCancelAction');
          this.sendAction('keyboardAction', 'TAB');
        }
      }

      let list = this.$(`.${styles['instant-entity-list']}`);
      let results = list.find(this.$(`.${itemStyles['instant-entity']}`));
      let focused = list.find(this.$(`.${itemStyles['instant-entity']}.${itemStyles.focused}`));
      list.find(this.$(`.${itemStyles['instant-entity']}.${itemStyles.focused}`)).removeClass(itemStyles.focused);

      if (results && results.length) {
        let focusedIndex = results.toArray().indexOf(focused[0]);
        let index = (focusedIndex === -1) ? 0 : focusedIndex;

        if (event.keyCode === KeyCodes.up) {
          index = (focusedIndex - 1 < 0) ? results.length - 1 : focusedIndex - 1;
        }
        else if (event.keyCode === KeyCodes.down) {
          index = (focusedIndex + 1 >= results.length) ? 0 : focusedIndex + 1;
        }

        this.$(results[index]).addClass(itemStyles.focused);

        this.scrollToItemIfOutOfView(this.$(results[index]), event);

        if (event.keyCode === KeyCodes.enter) {
          list.find(this.$(`.${itemStyles['instant-entity']}.${itemStyles.focused}`)).click();
        }
      }
    },

    addFocus(event) {
      this.$(`.${itemStyles['instant-entity']}.${itemStyles.focused}`).removeClass(itemStyles.focused);
      $(event.currentTarget).addClass(itemStyles.focused);
    },

    removeFocus(event) {
      $(event.currentTarget).removeClass(itemStyles.focused);
    },

    setInstantEntity(entity) {
      this.set('isInputDirty', false);
      try {
        this.get('loadInstantUsers').cancelAll();
        this.get('loadInstantOrgs').cancelAll();
      }
      catch (err) {
        // err is a Task Cancellation error.
        // Safely ignored.
      }

      this.set('actionTriggered', true);

      this.sendAction('action', entity);
    },

    enablePointer(e) {
      const { x, y } = this.get('pointerLocation');
      if (e.clientX !== x || e.clientY !== y) {
        this.set('disablePointer', false);
        this.set('pointerLocation', {x: e.clientX, y: e.clientY});
      }
    },

    trackPointer(e) {
      this.set('pointerLocation', {x: e.clientX, y: e.clientY});
    }
  }
});
