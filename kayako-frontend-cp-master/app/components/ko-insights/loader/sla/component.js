import { get } from '@ember/object';
import ObjectProxy from '@ember/object/proxy';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import RSVP from 'rsvp';
import _ from 'npm:lodash';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import diffAttrs from 'ember-diff-attrs';
import { getOwner } from '@ember/application';
import { isEmpty } from '@ember/utils';

export default Component.extend({
  tagName: '',
  insights: service(),
  metricsQueryParams: null,
  slaId: null,
  queryTerm: '',

  request: null,

  slas: null,
  slaTarget: null,
  slaPerformance: null,
  slaItem: null,

  _request(slaId, queryParams) {
    const insights = this.get('insights');
    const targetEndpoint = insights.slaTargetEndpoint();
    const performanceEndpoint = insights.slaPerformanceEndpoint();
    const adapter = getOwner(this).lookup('adapter:application');

    let requestHash = {};

    requestHash.slaTarget = adapter.ajax(targetEndpoint, 'GET', _.merge({ data: queryParams}, { data: { sla_id: slaId } }));
    requestHash.slaPerformance = adapter.ajax(performanceEndpoint, 'GET', _.merge({ data: queryParams}, { data: { sla_id: slaId } }));

    const promise = ObjectProxy.extend(PromiseProxyMixin).create({ promise: RSVP.hash(requestHash) });

    this.set('request', promise);

    return promise;
  },

  _handlePromise(data, slaId) {
    if (this.isDestroying || this.isDestroyed) {
      return null;
    }

    let slaData = this.get('insights').restructureSlaPerformanceSeries(
      data.slaPerformance.data,
      data.slaPerformance.resources,
      this.get('slas'),
      slaId
    );

    this.set('slaTarget', data.slaTarget.data);
    this.set('slaPerformance', slaData.data);
    this.set('slaItem', slaData.slaItem);

    return data;
  },

  didReceiveAttrs: diffAttrs('metricsQueryParams', 'slaId', function(changedAttrs, ...args) {
    const newQueryParams = this.get('metricsQueryParams.data') || {};

    Reflect.deleteProperty(newQueryParams, 'include');

    if (!changedAttrs || !this.get('slas')) {
      this.get('insights').requestSLAs().then(slas => {
        if (this.isDestroying || this.isDestroyed) {
          return;
        }

        if (!isEmpty(slas)) {
          this.set('slas', slas);
          const slaId = this.get('slaId') || slas.get('firstObject.id');

          this._request(slaId, newQueryParams)
            .then(data => this._handlePromise(data, slaId));
        }
      });
    } else {
      if (!isEmpty(this.get('slas'))) {
        const slaId = this.get('slaId') || this.get('slas.firstObject.id');

        this._request(slaId, newQueryParams)
          .then(data => this._handlePromise(data, slaId));
      }
    }
  }),

  filteredSlas: computed('slas', 'queryTerm', function() {
    const queryTerm = this.get('queryTerm').toLowerCase();
    const slas = this.get('slas') || [];

    return slas.filter(sla => sla && String(get(sla, 'title')).toLowerCase().match(queryTerm));
  })
});
