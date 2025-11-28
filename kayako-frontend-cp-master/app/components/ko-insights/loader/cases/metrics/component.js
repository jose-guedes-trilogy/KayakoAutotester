import ObjectProxy from '@ember/object/proxy';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import _ from 'npm:lodash';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import findBy from 'frontend-cp/lib/computed/find-by';
import humanizeSeconds from 'frontend-cp/lib/computed/humanize-seconds';
import _difference from 'frontend-cp/lib/object-difference';
import diffAttrs from 'ember-diff-attrs';
import { getOwner } from '@ember/application';

export default Component.extend({
  tagName: '',
  insights: service(),

  // Params
  metricsQueryParams: null,

  /** @private **/
  updatedQueryParams: null,

  didReceiveAttrs: diffAttrs('metricsQueryParams', function(changedAttrs, ...args) {
    let oldValues = changedAttrs && changedAttrs.metricsQueryParams ? changedAttrs.metricsQueryParams[0].data : {};
    let newValues = this.get('metricsQueryParams.data');

    Reflect.deleteProperty(oldValues, 'include');
    Reflect.deleteProperty(newValues, 'include');

    const differs = _difference(oldValues, newValues);
    const allowedParameters = [
      'agent_id', 'team_id', 'start_at', 'end_at', 'previous_start_at', 'previous_end_at', 'trial'
    ];

    // if one of the allowed parameters changed, proceed with request
    if (_.intersection(differs, allowedParameters).length) {
      this.set('updatedQueryParams', { data: newValues });
    }
  }),

  request: computed('updatedQueryParams', function() {
    const insights = this.get('insights');
    const adapter = getOwner(this).lookup('adapter:application');
    const endpoint = insights.metricsEndpoint();

    return ObjectProxy.extend(PromiseProxyMixin).create({
      promise: adapter.ajax(endpoint, 'GET', this.get('updatedQueryParams')).then(data => {
        if (this.isDestroying || this.isDestroyed) {
          return;
        }

        this.set('metrics', data.data);
      })
    });
  }),

  metrics: null,

  totalAssignedCases: findBy('metrics.metric', 'name', 'total_assigned'),
  totalCreatedCases: findBy('metrics.metric', 'name', 'total_created'),
  customersHelped: findBy('metrics.metric', 'name', 'customers_helped'),
  casesTouched: findBy('metrics.metric', 'name', 'cases_touched'),
  totalPublicReplies: findBy('metrics.metric', 'name', 'total_public_replies'),
  averageFirstResponseTime: findBy('metrics.metric', 'name', 'average_first_response_time'),
  averageRepliesToResolution: findBy('metrics.metric', 'name', 'average_replies_to_resolution'),
  percentageFirstContactResolved: findBy('metrics.metric', 'name', 'percentage_first_contact_resolved'),
  averageTeamChanges: findBy('metrics.metric', 'name', 'average_team_changes'),
  averageAssigneeChanges: findBy('metrics.metric', 'name', 'average_assignee_changes'),
  averageFirstAssignmentTime: findBy('metrics.metric', 'name', 'average_first_assignment_time'),

  averageFirstResponseTimeValue: humanizeSeconds('averageFirstResponseTime.value'),
  averageFirstResponseTimeValuePrevious: humanizeSeconds('averageFirstResponseTime.previous'),
  averageFirstAssignmentTimeValue: humanizeSeconds('averageFirstAssignmentTime.value'),
  averageFirstAssignmentTimePrevious: humanizeSeconds('averageFirstAssignmentTime.value')
});
