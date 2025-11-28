import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import { inject as service } from '@ember/service';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute('sla'), {
  i18n: service(),

  model(params) {
    return RSVP.hash({
      definitions: this.store.query('definition', { type: 'sla' }),
      priorities: this.store.query('case-priority', {})
    });
  },

  setupController(controller, model) {
    model.sla = this.store.createRecord('sla');
    model.sla.get('predicateCollections').createRecord({
      propositions: [this.store.createRecord('proposition', {})]
    });
    controller.setProperties(model);
  }
});
