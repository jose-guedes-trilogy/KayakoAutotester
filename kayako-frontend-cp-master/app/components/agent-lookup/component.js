import { inject as service } from '@ember/service';
import { get, computed } from '@ember/object';
import Component from '@ember/component';
import { task, timeout } from 'ember-concurrency';
import * as KeyCodes from 'frontend-cp/lib/keycodes';

function normalizeUser(u) {
  return { id: get(u, 'id'), text: get(u, 'text') || get(u, 'fullName') || get(u, 'full_name') };
}

export default Component.extend({
  store: service(),

  options: [],

  disabled: false,

  selected: computed('options', {
    set(_, selection) {
      if (!selection) { 
        return null;
      }
      const options = this.get('options');
      if (!options.length) {
        this.set('options', [normalizeUser(selection)]);
      }
      return normalizeUser(selection);
    }
  }),

  // Tasks
  search: task(function * (name) {
    yield timeout(300);
    let users = yield this.get('store').query('user', { in: 'ADMINS,AGENTS', name: name });
    let lowercaseTerm = name.toLowerCase();
    let specialResults = this.get('options').filter(e => e.text.toLowerCase().indexOf(lowercaseTerm) > -1);
    let searchResults = users.map(normalizeUser);
    let combinedResults = specialResults.concat(searchResults);
    let uniqueResults = combinedResults.reduce((acc, current) => {
      if (!acc.find(item => String(item.id) === String(current.id))) {
        acc.push(current);
      }
      return acc;
    }, []);
    return uniqueResults;
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
