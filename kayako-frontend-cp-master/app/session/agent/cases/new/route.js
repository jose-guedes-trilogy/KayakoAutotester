import RSVP from 'rsvp';
import { inject as service } from '@ember/service';
import TabbedRoute from 'frontend-cp/routes/abstract/tabbed-route';
import { getOwner } from '@ember/application';

export default TabbedRoute.extend({
  store: service(),
  i18n: service(),
  processManager: service(),

  model({ requester_id, timestamp }) {
    const store = this.get('store');

    const newCase = this.store.peekAll('case').findBy('creationTimestamp', timestamp);
    if (newCase) {
      return newCase;
    }

    if (!requester_id) {
      return RSVP.hash({
        statuses: store.findAll('case-status'),
        caseForms: store.findAll('case-form')
      }).then(({ statuses, caseForms }) => {
        const form = caseForms.find(caseForm => caseForm.get('isDefault') === true);

        return this.store.createRecord('case', {
          form,
          status: statuses.find(model => model.get('statusType') === 'NEW'),
          creationTimestamp: timestamp
        });
      });
    }
    else {
      return RSVP.hash({
        requester: store.findRecord('user', requester_id),
        replyChannels: store.query('channel', { user_id: requester_id }),
        statuses: store.findAll('case-status'),
        caseForms: store.findAll('case-form')
      }).then(({ requester, replyChannels, statuses, caseForms }) => {
        const sourceChannel = replyChannels.objectAt(0);
        const form = caseForms.find(caseForm => caseForm.get('isDefault') === true);

        return this.store.createRecord('case', {
          requester, replyChannels, sourceChannel, form,
          status: statuses.find(model => model.get('statusType') === 'NEW'),
          creationTimestamp: timestamp
        });
      });
    }
  },

  afterModel(model, transition) {
    let processManager = this.get('processManager');
    let process = processManager.getOrCreateProcess(model, 'case-new');
    processManager.setForegroundProcess(process);

    let tabStore = this.get('tabStore');
    let tab = tabStore.open(transition);

    tabStore.update(tab, { process });
    this.set('tab', tab);

    let state = process.get('state');

    if (!state) {
      const CaseStateManager = getOwner(this).factoryFor('state-manager:case');
      state = CaseStateManager.create({model, tab});

      process.set('state', state);
    }

    this.set('state', state);

    this._super(...arguments);
  },

  setupController(controller, model) {
    this._super(...arguments);
    controller.set('state', this.get('state'));
  },

  actions: {
    transitionToNewlyCreatedCase(newCase) {
      const tabStore = this.get('tabStore');
      tabStore.leave(this.tab);
      tabStore.close(this.tab);
      this.transitionTo('session.agent.cases.case.index', newCase.get('id'));
    }
  }
});
