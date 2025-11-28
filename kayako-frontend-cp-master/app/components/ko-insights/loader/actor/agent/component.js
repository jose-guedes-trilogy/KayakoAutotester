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
      promise: this.get('store')
        .query('user', {role: 'agent', limit: 500, is_enabled: true})
        .then(users => {
          return users.filter(user => user.get('isEnabled'))
            .sort((a, b) => {
              return a.get('fullName') >= b.get('fullName') ? 1 : -1;
            });
        })
    });

    this.set('request', promise);
  },

  data: reads('request.content'),

  actor: computed('data', 'actorId', function() {
    const data = this.get('data');

    if (!data) {
      return {};
    }

    return this.get('data').find(agent => {
      return agent.get('id') === this.get('actorId');
    });
  }),

  description: computed('actor.fullName', function() {
    const i18n = this.get('i18n');

    return i18n.t('insights.agents.subtitle', {
      name: this.get('actor.fullName')
    });
  })
});
