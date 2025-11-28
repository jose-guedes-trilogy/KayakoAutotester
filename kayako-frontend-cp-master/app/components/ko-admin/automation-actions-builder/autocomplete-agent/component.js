import { inject as service } from '@ember/service';
import { get, computed } from '@ember/object';
import BaseComponent from '../base/component';
import { task, timeout } from 'ember-concurrency';
import * as KeyCodes from 'frontend-cp/lib/keycodes';

function normalizeUser(u) {
  return { id: get(u, 'id'), text: get(u, 'fullName') };
}

export default BaseComponent.extend({
  store: service(),

  // CPs
  options: computed('definition.valuesSortedAphabetically', function() {
    let originalData = this.get('definition.valuesSortedAphabetically');
    return originalData.map(e => ({ id: e.id, text: e.value }));
  }),

  selected: computed('automationAction.value', 'options', {
    get() {
      let id = this.get('automationAction.value');
      if (!id) { return null; }
      return this.get('options').findBy('id', id) ||
        this.get('store').find('user', id).then(normalizeUser);
    },
    set(_, selection) {
      this.set('automationAction.value', selection.id);
      return selection;
    }
  }),

  // Tasks
  search: task(function * (name) {
    yield timeout(300);
    let users = yield this.get('store').query('user', { in: 'ADMINS,AGENTS', name: name });
    let lowercaseTerm = name.toLowerCase();
    let specialResults = this.get('options').filter(e => e.text.toLowerCase().indexOf(lowercaseTerm) > -1);
    let searchResults = users.map(normalizeUser);
    return specialResults.concat(searchResults);
  }).restartable(),

  // Actions
  actions: {
    preventSubmissionOnEnter(_, e) {
      if (e.keyCode === KeyCodes.enter) {
        e.preventDefault();
      }
    }
  }
});
