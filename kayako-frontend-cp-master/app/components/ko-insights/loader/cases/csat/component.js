import ObjectProxy from '@ember/object/proxy';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import _ from 'npm:lodash';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import _difference from 'frontend-cp/lib/object-difference';
import diffAttrs from 'ember-diff-attrs';
import { getOwner } from '@ember/application';

export default Component.extend({
  tagName: '',
  insights: service(),
  metricsQueryParams: null,
  onUpdate: () => {},

  /** @private **/
  updatedQueryParams: null,

  didReceiveAttrs: diffAttrs('metricsQueryParams', function(changedAttrs, ...args) {
    let oldValues = changedAttrs && changedAttrs.metricsQueryParams ? changedAttrs.metricsQueryParams[0].data : {};
    let newValues = this.get('metricsQueryParams.data');

    Reflect.deleteProperty(oldValues, 'include');
    Reflect.deleteProperty(newValues, 'include');

    const differs = _difference(oldValues, newValues);
    const allowedParameters = [
      'agent_id', 'team_id', 'interval', 'start_at', 'end_at', 'previous_start_at', 'previous_end_at', 'trial'
    ];

    // if one of the allowed parameters changed, proceed with request
    if (_.intersection(differs, allowedParameters).length) {
      this.set('updatedQueryParams', { data: newValues });
    }
  }),

  request: computed('updatedQueryParams', function() {
    const insights = this.get('insights');
    const adapter = getOwner(this).lookup('adapter:application');
    const endpoint = insights.csatEndpoint();

    return ObjectProxy.extend(PromiseProxyMixin).create({
      promise: adapter.ajax(endpoint, 'GET', this.get('updatedQueryParams')).then(data => {
        if (this.isDestroying || this.isDestroyed) {
          return null;
        }

        this.attrs.onUpdate && this.attrs.onUpdate(data.data);
        this.set('series', data.data);

        return data;
      })
    });
  }),

  series: null,
  metric: computed.alias('series.metric')
});
