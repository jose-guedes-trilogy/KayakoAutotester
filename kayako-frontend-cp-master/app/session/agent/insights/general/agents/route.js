import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import { monthFormat } from 'frontend-cp/lib/get-date-range-at';

import { variation } from 'ember-launch-darkly';

export default Route.extend({
  session: service('session'),
  insights: service(),
  metrics: service(),
  plan: service(),

  queryParams: {
    agent: { refreshModel: true },
    sla: { refreshModel: true }
  },

  model(params) {
    const user = this.get('session.user');
    const insights = this.get('insights');

    let agentId = params.agent ? params.agent : user.get('id');

    const insightsParams = this.paramsFor('session.agent.insights');
    let startAt = insightsParams.startAt ? insightsParams.startAt : monthFormat(new Date(new Date().getTime() - 86400000 * 30));
    let endAt = insightsParams.endAt ? insightsParams.endAt : monthFormat(new Date());
    let interval = insightsParams.interval ? insightsParams.interval : 'DAY';
    let sla = params.sla ? params.sla : null;

    let { previousStart, previousEnd } = insights.getPreviousDates(startAt, endAt);

    let metricsQueryParams = {
      data: {
        agent_id: agentId,
        start_at: startAt + 'T00:00:00.000Z',
        end_at: endAt + 'T23:59:59.999Z',
        previous_start_at: previousStart + 'T00:00:00.000Z',
        previous_end_at: previousEnd + 'T23:59:59.999Z',
        interval: interval,
        trial: insights.isTrialMode() && insightsParams.trial
      }
    };

    return RSVP.hash({
      agentId: agentId,
      startAt: startAt,
      endAt: endAt,
      interval: interval,
      slaId: sla,
      metricsQueryParams: metricsQueryParams
    });
  },

  beforeModel(transition) {
    if (variation('release-restrict-insights')) {
      if (!this.get('plan').has('agent_team_insights') && !variation('feature-restrict-agent-team-insights')) {
        this.transitionTo('session.agent.insights.general.cases');
      }
    }
  },

  setupController(controller, data) {
    const insights = this.get('insights');

    this.get('controller').setProperties({
      agent: data.agentId,
      sla: data.slaId,
      startAt: data.startAt,
      endAt: data.endAt,
      interval: data.interval,
      metricsQueryParams: data.metricsQueryParams
    });

    if (insights.isTrialMode()) {
      insights.pushTrialNotification(() => {
        this.transitionTo({ queryParams: { trial: false } });
      });
    }
  },

  actions: {
    didTransition() {
      if (variation('release-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'agent_insights_viewed'
        });
      }
    }
  }
});
