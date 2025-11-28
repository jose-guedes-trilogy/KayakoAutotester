import Component from '@ember/component';
import { task, timeout } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';

export default Component.extend({
  tagName: '',

  store: service(),

  predicateCollections: null,

  previews: reads('preview.lastSuccessful.value'),

  init() {
    this._super(...arguments);
    if (!this.get('predicateCollections')) {
      this.set('predicateCollections', []);
    }
  },

  didReceiveAttrs() {
    this._super(...arguments);
    this.get('preview').perform();
  },

  preview: task(function * () {
    yield timeout(1000);

    let collections = [];
    this.get('predicateCollections').forEach(collection => {

      let propositions = [];
      collection.get('propositions').forEach(proposition => {
        let { field, operator, value } = proposition.getProperties('field', 'operator', 'value');
        if (field && operator && value) {
          propositions.push({ field, operator, value });
        }
      });

      if (propositions.length) {
        collections.push({ propositions });
      }
    });

    if (collections.length === 0) {
      return [];
    }

    try {
      return yield this.get('store').query('report-case', { predicate_collections: collections, object: 'CASES' });
    } catch (_) {
      return [];
    }
  }).restartable()

});
