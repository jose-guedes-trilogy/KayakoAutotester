import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import { get } from '@ember/object';

export default Component.extend({
  tagName: '',

  //Attrs
  users: null,
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
      'userComposite',
      'lastseenat',
      'createdat'
    ]);
  },

  //CP's

  //Methods
  maxWidthForColumn(column) {
    if (column === 'userComposite') {
      return 1500;
    } else {
      return 300;
    }
  },

  minWidthForColumn(column) {
    if (column === 'userComposite') {
      return 500;
    } else {
      return 100;
    }
  },

  //Tasks
  viewUser: task(function * (user) {
    const router = this.get('router');
    const id = get(user, 'id');

    router.transitionTo('session.agent.users.user', [id], { returnTo: router.get('currentRouteName') });
  }),

  //Actions
  actions: {
    viewUser(user, hasModifier) {
      if (hasModifier) {
        this.get('tabStore').createTabNextToActiveTab('session.agent.users.user', user);
      } else {
        this.get('viewUser').perform(user);
      }
    }
  }
});
