import ObjectProxy from '@ember/object/proxy';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { getOwner } from '@ember/application';

export default Component.extend({
  tagName: '',
  insights: service(),
  metricsQueryParams: null,

  request: computed('metricsQueryParams', function() {
    const insights = this.get('insights');
    const adapter = getOwner(this).lookup('adapter:application');
    const endpoint = insights.channelEndpoint();

    return ObjectProxy.extend(PromiseProxyMixin).create({
      promise: adapter.ajax(endpoint, 'GET', this.get('metricsQueryParams')).then(data => {
        if (this.isDestroying || this.isDestroyed) {
          return;
        }

        this.set('series', data.data);
      })
    });
  }),

  series: null,

  totalMessages: computed('series', function() {
    let total = 0;
    const series = this.get('series');

    if (!series) {
      return 0;
    }

    series.channel_series.forEach(channel => {
      total = channel.series.data.reduce((a, b) => parseInt(a) + parseInt(b), total);
    });

    return total;
  })
});
