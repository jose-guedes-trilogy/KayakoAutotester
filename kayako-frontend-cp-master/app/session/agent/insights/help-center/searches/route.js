import { inject as service } from '@ember/service';
import { hash } from 'rsvp';
import Route from '@ember/routing/route';
import { monthFormat } from 'frontend-cp/lib/get-date-range-at';

import { variation } from 'ember-launch-darkly';

export default Route.extend({
  session: service('session'),
  insights: service(),
  metrics: service(),
  plan: service(),

  model() {
    const insights = this.get('insights');
    const insightsParams = this.paramsFor('session.agent.insights');
    let startAt = insightsParams.startAt ? insightsParams.startAt : monthFormat(new Date(new Date().getTime() - 86400000 * 30));
    let endAt = insightsParams.endAt ? insightsParams.endAt : monthFormat(new Date());

    let metricsQueryParams = {
      data: {
        start_at: startAt + 'T00:00:00.000Z',
        end_at: endAt + 'T23:59:59.999Z',
        trial: insights.isTrialMode() && insightsParams.trial
      }
    };

    return hash({
      startAt: startAt,
      endAt: endAt,
      metricsQueryParams: metricsQueryParams
    });
  },

  beforeModel(transition) {
    if (variation('release-restrict-insights')) {
      if (!this.get('plan').has('helpcenter_insights') && !variation('feature-restrict-helpcenter-insights')) {
        this.transitionTo('session.agent.insights.general.cases');
      }
    }
  },

  setupController(controller, hash) {
    const insights = this.get('insights');

    controller.setProperties({
      startAt: hash.startAt,
      endAt: hash.endAt,
      metricsQueryParams: hash.metricsQueryParams
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
          event: 'searches_insights_viewed'
        });
      }
    }
  }
});
