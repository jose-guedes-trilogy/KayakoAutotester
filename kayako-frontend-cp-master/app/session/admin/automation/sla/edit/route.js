import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import { inject as service } from '@ember/service';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute(), {
  i18n: service(),

  model(params) {
    const store = this.get('store');

    return RSVP.hash({
      sla: store.findRecord('sla', params.sla_id),
      definitions: store.query('definition', { type: 'sla' }),
      priorities: store.query('case-priority', {})
    });
  },

  setupController(controller, model) {
    controller.setProperties(model);
  }
});
