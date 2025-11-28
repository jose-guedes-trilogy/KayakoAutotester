import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

import { variation } from 'ember-launch-darkly';

export default Controller.extend({
  metrics: service(),

  actions: {
    ctaClick() {
      if (variation('ops-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'Salesforce - View landing page',
          category: 'Admin'
        });
      }
    }
  }
});
