import ObjectProxy from '@ember/object/proxy';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { getOwner } from '@ember/application';
import humanizeSeconds from 'frontend-cp/lib/computed/humanize-seconds';

export default Component.extend({
  tagName: '',
  insights: service(),
  metricsQueryParams: null,
  onUpdate: () => {},

  request: computed('metricsQueryParams', function() {
    const insights = this.get('insights');
    const adapter = getOwner(this).lookup('adapter:application');
    const endpoint = insights.caseResolutionEndpoint();

    return ObjectProxy.extend(PromiseProxyMixin).create({
      promise: adapter.ajax(endpoint, 'GET', this.get('metricsQueryParams')).then(data => {
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

  metricName: reads('series.metric.name'),
  metricDelta: reads('series.metric.delta_percent'),
  metricValue: humanizeSeconds('series.metric.value'),
  metricPrevious: humanizeSeconds('series.metric.previous')
});
