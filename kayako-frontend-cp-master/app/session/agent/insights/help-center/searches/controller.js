import Controller from '@ember/controller';
import { observer } from '@ember/object';
import { run } from '@ember/runloop';
import { inject as service } from '@ember/service';
import InsightsControlActions from 'frontend-cp/mixins/insights-control-actions';

import { variation } from 'ember-launch-darkly';

export default Controller.extend(InsightsControlActions, {
  metrics: service(),

  startAt: null,
  endAt: null,
  metricsQueryParams: null,

  metricsObserver: observer('startAt', 'endAt', function() {
    run.debounce(this, '_trackEvent', 150);
  }),

  _trackEvent() {
    if (variation('ops-eventTracking')) {
      this.get('metrics').trackEvent({
        event: 'Insights - Toggle filter',
        category: 'Agent'
      });
    }
  }
});
