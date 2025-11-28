import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { run } from '@ember/runloop';
import Ember from 'ember';
import moment from 'moment';
import styles from './styles';

export default Component.extend({
  tagName: '',
  // State
  selectedNavItem: null,

  // Services
  store: service(),
  notification: service(),
  i18n: service(),
  routing: service('-routing'),
  permissions: service(),
  transitionToRouteAction: 'transitionToRoute',

  // CPs
  canCreateUsers: computed(function () {
    return this.get('permissions').has('users.update');
  }),

  canCreateOrganizations: computed(function () {
    return this.get('permissions').has('organizations.update');
  }),

  dropdownWidthClass: computed('selectedNavItem', 'canCreateUsers', 'canCreateOrganizations', function() {
    if (this.get('selectedNavItem')) {
      // always full width if we're inside a form
      return null;
    } else {
      let length = 2; // Setting to 2, because there will be at 2-4 items in two rows. So 2 columns works.

      return styles[`drop--${length}`];
    }
  }),

  // Actions
  actions: {
    reset() {
      if (Ember.testing) {
        this.set('selectedNavItem', null);
      } else {
        run.next(this, this.set, 'selectedNavItem', null);
      }
    },

    onTabCreateComplete(route, model) {
      this._createSuccessNotification(route);

      this.get('routing').transitionTo(route, [model]);
    },

    transitionToRoute(dropdown, ...rest) {
      this.sendAction('transitionToRouteAction', ...rest);

      dropdown.actions.close();
    },

    openSearchTab(dropdown) {
      let searchHash = ((new Date()).getTime()).toString(16);
      this.get('routing').transitionTo('session.agent.search-new', [searchHash]);
      dropdown.actions.close();
    },

    openNewConversationTab(dropdown) {
      let dateStamp = moment().format('YYYY-MM-DD-hh-mm-ss');
      this.get('routing').transitionTo('session.agent.cases.new.index', [dateStamp]);

      dropdown.actions.close();
    },

    openNewUserTab(dropdown) {
      let dateStamp = moment().format('YYYY-MM-DD-hh-mm-ss');
      this.get('routing').transitionTo('session.agent.users.new.index', [dateStamp]);

      dropdown.actions.close();
    },

    openNewOrganizationTab(dropdown) {
      let dateStamp = moment().format('YYYY-MM-DD-hh-mm-ss');
      this.get('routing').transitionTo('session.agent.organizations.new.index', [dateStamp]);

      dropdown.actions.close();
    }
  },

  // Methods

  _createSuccessNotification(route) {
    let notificationMessage = null;

    switch (route) {
      case 'session.agent.users.user':
        notificationMessage = this.get('i18n').t('users.user.created');
        break;
      case 'session.agent.cases.case':
        // intentionally left blank, because at this step we do not create a Case
        break;
      case 'session.agent.organizations.organization':
        notificationMessage = this.get('i18n').t('organization.created');
        break;
    }

    if (notificationMessage) {
      this.get('notification').add({
        type: 'success',
        title: notificationMessage,
        autodismiss: true
      });
    }
  }
});
