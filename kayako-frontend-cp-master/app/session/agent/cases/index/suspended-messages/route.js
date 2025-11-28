import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import config from 'frontend-cp/config/environment';

const limit = config.casesPageSize;

export default Route.extend({
  caseListTab: service(),

  queryParams: {
    page: { refreshModel: true }
  },

  beforeModel() {
    this.get('caseListTab.refreshCases').cancelAll();
    this.get('caseListTab').set('currentCachedView', null);
  },

  model({ page }) {
    let offset = (parseInt(page, 10) - 1) * limit;
    return this.store.query('mail', { is_suspended: true, offset, limit });
  },

  setupController(controller, mails) {
    controller.set('model', mails);
  },

  // Actions
  actions: {
    showMail(mail) {
      this.transitionTo('session.agent.cases.index.suspended-messages.show', mail);
    },

    refreshPage(page = null) {
      const params = this.paramsFor(this.routeName);

      if (page) {
        params.page = page;
      }

      const controller = this.controllerFor('session.agent.cases.index.suspended-messages');

      this.model(params).then((model) => {
        if (model.get('length') === 0 && params.page > 1) {
          controller.set('page', params.page - 1);
          return;
        }

        this.setupController(controller, model);
      });
    }
  }
});
