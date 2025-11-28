import Controller from '@ember/controller';
import { observer } from '@ember/object';
import { run } from '@ember/runloop';
import { inject as service } from '@ember/service';

import { variation } from 'ember-launch-darkly';

export default Controller.extend({
  metrics: service(),

  queryParams: [
    'startAt',
    'endAt',
    'interval',
    'trial'
  ],

  startAt: null,
  endAt: null,
  interval: null,
  trial: null,

  metricsObserver: observer('startAt', 'endAt', 'interval', function() {
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
