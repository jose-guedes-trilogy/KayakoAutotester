import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import { monthFormat } from 'frontend-cp/lib/get-date-range-at';

import { variation } from 'ember-launch-darkly';

export default Route.extend({
  insights: service(),
  metrics: service(),

  model() {
    const insights = this.get('insights');
    const insightsParams = this.paramsFor('session.agent.insights');

    let startAt = insightsParams.startAt ? insightsParams.startAt : monthFormat(new Date(new Date().getTime() - 86400000 * 30));
    let endAt = insightsParams.endAt ? insightsParams.endAt : monthFormat(new Date());
    let interval = insightsParams.interval ? insightsParams.interval : 'DAY';

    let {previousStart, previousEnd} = insights.getPreviousDates(startAt, endAt);

    let metricsQueryParams = {
      data: {
        start_at: startAt + 'T00:00:00.000Z',
        end_at: endAt + 'T23:59:59.999Z',
        previous_start_at: previousStart + 'T00:00:00.000Z',
        previous_end_at: previousEnd + 'T23:59:59.999Z',
        interval: interval,
        trial: insights.isTrialMode() && insightsParams.trial
      }
    };

    return RSVP.hash({
      startAt: startAt,
      endAt: endAt,
      interval: interval,
      metricsQueryParams: metricsQueryParams
    });
  },

  setupController(controller, data) {
    const insights = this.get('insights');

    this.get('controller').setProperties({
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
          event: 'conversation_insights_viewed'
        });
      }
    }
  }
});
