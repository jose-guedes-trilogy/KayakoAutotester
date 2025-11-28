import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import KeyboardShortcuts from 'ember-keyboard-shortcuts/mixins/component';

export default Component.extend(KeyboardShortcuts, {
  tagName: '',

  tabStore: service(),

  tabs: computed.alias('tabStore.tabs'),

  keyboardShortcuts: {
    ']': {
      action: 'selectNextTab',
      global: false
    },
    '[': {
      action: 'selectPreviousTab',
      global: false
    },
    x: {
      action: 'closeCurrentTab',
      global: false
    }
  },

  actions: {
    closeTab(tab, event) {
      let tabStore = this.get('tabStore');

      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }

      tabStore.close(tab);
    },

    selectNextTab() {
      let tabStore = this.get('tabStore');
      tabStore.selectNextTab();
    },

    selectPreviousTab() {
      let tabStore = this.get('tabStore');
      tabStore.selectPreviousTab();
    },

    closeCurrentTab() {
      let tabStore = this.get('tabStore');
      tabStore.closeActiveTab();
    }
  }
});
