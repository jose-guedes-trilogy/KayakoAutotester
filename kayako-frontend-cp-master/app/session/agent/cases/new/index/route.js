import { hash } from 'rsvp';
import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({
  store: service(),
  casePriorityCache: service('cache/case-priority'),

  model() {
    const caseModel = this.modelFor('session.agent.cases.new');
    const store = this.get('store');
    const casePriorityCache = this.get('casePriorityCache');

    return hash({
      caseFields: store.findAll('case-field'),
      priorities: casePriorityCache.getAll(),
      statuses: store.findAll('case-status'),
      types: store.findAll('case-type'),
      caseForms: store.findAll('case-form'),
      teams: store.query('team', {}),
      case: caseModel
    });
  },

  setupController(controller, model) {
    const parentController = this.controllerFor('session.agent.cases.new');
    controller.set('state', parentController.get('state'));
    controller.setProperties(model);
  }
});
