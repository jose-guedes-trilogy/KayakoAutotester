import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import { get } from '@ember/object';

export default Component.extend({
  tagName: '',

  //Attrs
  organizations: null,
  isLoading: null,

  //State
  columnList: null,

  //Serivces
  router: service('-routing'),
  tabStore: service(),

  //Lifecycle Hooks
  init() {
    this._super(...arguments);

    this.set('columnList', [
      'orgComposite',
      'updatedat',
      'createdat'
    ]);
  },

  //CP's

  //Methods
  maxWidthForColumn(column) {
    if (column === 'orgComposite') {
      return 1500;
    } else {
      return 300;
    }
  },

  minWidthForColumn(column) {
    if (column === 'orgComposite') {
      return 500;
    } else {
      return 100;
    }
  },

  //Tasks
  viewOrganization: task(function * (organization) {
    let router = this.get('router');
    let id = get(organization, 'id');

    router.transitionTo('session.agent.organizations.organization', [id], { returnTo: router.get('currentRouteName') });
  }),

  //Actions
  actions: {
    viewOrganization(organization, hasModifier) {
      if (hasModifier) {
        this.get('tabStore').createTabNextToActiveTab('session.agent.organizations.organization', organization);
      } else {
        this.get('viewOrganization').perform(organization);
      }
    }
  }
});
