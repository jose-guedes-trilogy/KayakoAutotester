import { inject as service } from '@ember/service';
import { hash } from 'rsvp';
import Route from '@ember/routing/route';
import { variation } from 'ember-launch-darkly';

export default Route.extend({
  insights: service(),
  metrics: service(),
  plan: service(),

  model() {
    const insights = this.get('insights');
    const insightsParams = this.paramsFor('session.agent.insights');

    let metricsQueryParams = {
      data: {
        trial: insights.isTrialMode() && insightsParams.trial
      }
    };

    return hash({
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
    this._super(...arguments);

    const insights = this.get('insights');

    controller.setProperties({
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
          event: 'article_insights_viewed'
        });
      }
    }
  }
});
