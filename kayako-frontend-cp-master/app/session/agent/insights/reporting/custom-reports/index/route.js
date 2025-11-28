import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

import { variation } from 'ember-launch-darkly';

const PER_PAGE = 10;

export default Route.extend({
  queryParams: {
    page: { refreshModel: true }
  },

  store: service(),
  metrics: service(),
  plan: service(),

  model({ page }) {
    page = parseInt(page) || 1;
    const offset = (page - 1) * PER_PAGE;
    return this.get('store').query('report', { offset, limit: PER_PAGE });
  },

  beforeModel(transition) {
    if (variation('release-restrict-insights')) {
      if (!this.get('plan').has('custom_reporting') && !variation('feature-restrict-custom-reporting-insights')) {
        this.transitionTo('session.agent.insights.general.cases');
      }
    }
  },

  setupController(controller, reports) {
    controller.set('reports', reports);
    controller.set('pages', Math.ceil(reports.get('meta.total') / PER_PAGE));
  },

  actions: {
    didTransition() {
      if (variation('release-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'custom_reports_viewed'
        });
      }
    }
  }
});
