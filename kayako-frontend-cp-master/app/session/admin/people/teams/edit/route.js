import Route from '@ember/routing/route';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';
import RSVP from 'rsvp';

export default Route.extend(DirtyAwareRoute(), {
  model(params) {
    return RSVP.hash({
      team: this.store.findRecord('team', params.team_id),
      businessHours: this.store.findAll('business-hour')
    });
  },

  afterModel({ team }) {
    return team.get('members').reload();
  },

  setupController(controller, model) {
    controller.setProperties(model);
    controller.initEdits();
  }
});
