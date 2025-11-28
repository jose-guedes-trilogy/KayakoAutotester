import { get, computed } from '@ember/object';
import { isBlank } from '@ember/utils';
import { inject as service } from '@ember/service';
import BaseComponent from '../base/component';
import _ from 'npm:lodash';
import { task, timeout } from 'ember-concurrency';

export default BaseComponent.extend({
  store: service(),
  i18n: service(),

  // CPs
  tags: computed('automationAction.value', function() {
    let value = this.get('automationAction.value');
    let tags = isBlank(value) ? [] : value.split(',');
    return tags.map(str => ({ name: str.trim() }));
  }),

  // Tasks
  suggestTags: task(function * (searchTerm) {
    yield timeout(300);
    let addNewMessage = this.get('i18n').t('generic.addtagname', { tag: searchTerm });
    let data = yield this.get('store').query('tag', { name: searchTerm });
    let exactMatch = !!data.toArray().findBy('name', searchTerm) || !!this.get('tags').findBy('name', searchTerm);
    return _.difference(data.mapBy('name'), this.get('tags').mapBy('name'))
      .map(name => ({ name }))
      .concat(exactMatch ? [] : [{ name: addNewMessage, actualName: searchTerm }]);
  }).restartable(),

  // Actions
  actions: {
    addTag(tag) {
      let name = get(tag, 'actualName') || get(tag, 'name');
      let currentTags = this.get('tags');
      if (currentTags.find(t => tag === name)) {
        return;
      }
      this.set('automationAction.value', currentTags.mapBy('name').concat([name]).join(','));
    },

    removeTag(tag) {
      let currentTags = this.get('tags');
      currentTags.removeObject(tag);
      this.set('automationAction.value', currentTags.mapBy('name').join(','));
    }
  }
});
