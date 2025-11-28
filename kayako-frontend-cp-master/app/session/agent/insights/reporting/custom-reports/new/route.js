import Route from '@ember/routing/route';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import { variation } from 'ember-launch-darkly';

export default Route.extend(DirtyAwareRoute('report'), {
  store: service(),
  plan: service(),

  model() {
    const store = this.get('store');

    return RSVP.hash({
      definitions: store.query('definition', { type: 'report' }),
      report: store.createRecord('report', {
        predicateCollections: [store.createRecord('predicate-collection', {
          propositions: [store.createRecord('proposition')]
        })]
      })
    });
  },

  beforeModel(transition) {
    if (variation('release-restrict-insights')) {
      if (!this.get('plan').has('custom_reporting') && !variation('feature-restrict-custom-reporting-insights')) {
        this.transitionTo('session.agent.insights.general.cases');
      }
    }
  },

  setupController(controller, properties) {
    controller.setProperties(properties);
    controller.initEdits();
  }
});
