import { readOnly } from '@ember/object/computed';
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  notification: service(),
  insights: service(),
  session: service(),
  permissions: service(),

  currentUser: readOnly('session.user'),
  userPermissions: readOnly('session.permissions'),

  queryParams: {
    startAt: { refreshModel: true },
    endAt: { refreshModel: true },
    interval: { refreshModel: true },
    trial: { refreshModel: true }
  },

  _transitionToCases(transition) {
    if (transition.targetName === 'session.agent.insights.index') {
      this.transitionTo('session.agent.insights.general.cases');
    }
  },

  beforeModel(transition) {
    if (!this.get('permissions').has('insights.access', this.get('currentUser'))) {
      this.transitionTo('session.agent');
    } else {
      this._transitionToCases(transition);
    }
  },

  resetController: function(controller, isExiting, transition) {
    this._super(arguments);

    if (isExiting) {
      controller.set('trial', null);
      this.get('notification').removeAll();
      this.get('insights').restoreTrialNotification();
    }
  },

  actions: {
    willTransition(transition) {
      this._transitionToCases(transition);
    }
  }
});
