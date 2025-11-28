import Controller from '@ember/controller';
import { observer } from '@ember/object';
import { run } from '@ember/runloop';
import { inject as service } from '@ember/service';
import InsightsControlActions from 'frontend-cp/mixins/insights-control-actions';

import { variation } from 'ember-launch-darkly';

export default Controller.extend(InsightsControlActions, {
  metrics: service(),

  queryParams: [
    'team'
  ],

  metricsQueryParams: null,

  team: null,
  sla: null,

  metricsObserver: observer('team', 'sla', function() {
    run.debounce(this, '_trackEvent', 150);
  }),

  _trackEvent() {
    if (variation('ops-event-tracking')) {
      this.get('metrics').trackEvent({
        event: 'Insights - Toggle filter',
        category: 'Agent'
      });
    }
  }
});
