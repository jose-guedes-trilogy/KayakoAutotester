import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import { monthFormat } from 'frontend-cp/lib/get-date-range-at';
import { isEmpty } from '@ember/utils';
import { variation } from 'ember-launch-darkly';

export default Route.extend({
  insights: service(),
  metrics: service(),
  plan: service(),
  permissions: service(),

  queryParams: {
    sla: { refreshModel: true }
  },

  slas: null,

  beforeModel() {
    if (variation('release-restrict-insights')) {
      if (!((this.get('plan').has('insights_sla') && this.get('permissions').has('slas.manage'))) && !variation('feature-restrict-sla-insights')) {
        this.transitionTo('session.agent.insights.general.cases');
      }
    }
    return this.get('insights').requestSLAs().then(slas => {
      if (isEmpty(slas)) {
        this.transitionTo('session.agent.insights.general.cases');
      }
    });
  },

  model(params) {
    const insights = this.get('insights');
    const insightsParams = this.paramsFor('session.agent.insights');

    let startAt = insightsParams.startAt ? insightsParams.startAt : monthFormat(new Date(new Date().getTime() - 86400000 * 30));
    let endAt = insightsParams.endAt ? insightsParams.endAt : monthFormat(new Date());
    let interval = insightsParams.interval ? insightsParams.interval : 'DAY';
    let sla = params.sla ? params.sla : null;

    let metricsQueryParams = {
      data: {
        start_at: startAt + 'T00:00:00.000Z',
        end_at: endAt + 'T23:59:59.999Z',
        interval: interval,
        sla_id: sla,
        trial: insights.isTrialMode() && insightsParams.trial
      }
    };

    return RSVP.hash({
      startAt: startAt,
      endAt: endAt,
      interval: interval,
      slaId: sla,
      metricsQueryParams: metricsQueryParams
    });
  },

  setupController(controller, data) {
    const insights = this.get('insights');

    this.get('controller').setProperties({
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

  resetController(controller, isExiting) {
    if (isExiting) {
      this.controllerFor('session.agent.insights.sla.overview').set('sla', null);
    }
  },

  actions: {
    didTransition() {
      if (variation('release-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'sla_overview_insights_viewed'
        });
      }
    }
  }
});
