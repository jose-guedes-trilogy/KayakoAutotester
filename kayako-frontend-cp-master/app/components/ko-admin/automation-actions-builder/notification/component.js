import { equal } from '@ember/object/computed';
import { computed, set, get } from '@ember/object';
import { inject as service } from '@ember/service';
import BaseComponent from '../base/component';
import { task, timeout } from 'ember-concurrency';

function normalizeUser(u) {
  return { id: get(u, 'id'), text: get(u, 'fullName') };
}

export default BaseComponent.extend({
  store: service(),
  i18n: service(),

  attributeMultilineMappings: {
    subject: false, // <input>
    message: true   // <textarea>
  },

  // Lifecycle hooks
  init() {
    this._super(...arguments);
    let action = this.get('automationAction');
    let attributes = this.get('definition.attributes').reduce((obj, attr) => {
      if (!obj.hasOwnProperty(attr)) {
        obj[attr] = null;
      }
      return obj;
    }, get(action, 'attributes') || {});
    set(action, 'attributes', attributes);
  },

  // CPs
  options: computed('definition.valuesSortedAphabetically', function() {
    let originalData = this.get('definition.valuesSortedAphabetically');
    let sortedOptions = originalData.map(e => ({ id: e.id, text: e.value }));
    let cta = this.get('i18n').t('generic.select.select_or_type_to_search');
    return [{ text: cta, disabled: true }, ...sortedOptions];
  }),

  selected: computed('automationAction.value', 'options', {
    get() {
      let id = this.get('automationAction.value');
      if (!id) { return null; }
      const name = this.get('automationAction.name');
      if (name === 'notificationteam') {
        return this.get('options').findBy('id', id);
      } else {
        return this.get('options').findBy('id', id) ||
          this.get('store').find('user', id).then(normalizeUser);
      }
    },
    set(_, selection) {
      this.set('automationAction.value', selection.id);
      return selection;
    }
  }),

  searchEnabled: equal('definition.inputType', 'NOTIFICATION_USER'),

  // Tasks
  search: task(function * (name) {
    yield timeout(300);
    let users = yield this.get('store').query('user', { name: name, in: 'ADMINS,AGENTS,COLLABORATORS' });
    let lowercaseTerm = name.toLowerCase();
    let specialResults = this.get('options').filter(e => e.text.toLowerCase().indexOf(lowercaseTerm) > -1);
    let searchResults = users.map(normalizeUser);
    return specialResults.concat(searchResults);
  }).restartable(),

  // Actions
  actions: {
    updateMetadata(propertyName, e) {
      this.set(`automationAction.attributes.${propertyName}`, e.target.value);
    }
  }
});
