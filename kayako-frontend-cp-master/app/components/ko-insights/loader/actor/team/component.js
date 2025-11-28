import ObjectProxy from '@ember/object/proxy';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: '',
  store: service(),
  i18n: service(),
  metricsQueryParams: null,

  actorId: null,
  request: null,

  onUpdate: () => {},

  init() {
    this._super(...arguments);

    const promise = ObjectProxy.extend(PromiseProxyMixin).create({
      promise: this.get('store').findAll('team')
    });

    this.set('request', promise);
  },

  data: reads('request.content'),

  actor: computed('data', 'actorId', function() {
    const data = this.get('data');

    if (!data) {
      return {};
    }

    return this.get('data').find(actor => {
      return actor.get('id') === this.get('actorId');
    });
  }),

  description: computed('actor.title', function() {
    const i18n = this.get('i18n');

    return i18n.t('insights.teams.subtitle', {
      team: this.get('actor.title')
    });
  })
});
