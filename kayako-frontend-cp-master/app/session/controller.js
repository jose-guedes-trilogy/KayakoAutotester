import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { readOnly } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { dasherize } from '@ember/string';
import { variation } from 'ember-launch-darkly';

export default Controller.extend({
  // Services
  urlService: service('url'),
  tabStore: service(),
  session: service(),
  permissions: service(),
  caseListTab: service(),
  onBoardingStatus: service(),
  routing: service('-routing'),
  plan: service(),
  realtimePush: service(),

  // Attributes
  showingKeyboardHelp: false,
  isSearchActive: false,
  appAccessModal: false,
  signatureModal: false,
  twoFactorModal: false,
  twoFactorModalRole: null,
  changePasswordModal: false,

  // State
  /**
   * Array of listeners which will be automatically removed once this controller is destroyed
   * @type {Object[]}
   */
  disposableListeners: null,

  // Lifecycle

  init() {
    this._super(...arguments);
    this.set('disposableListeners', []);
  },

  /**
   * Remove the disposable listeners once the controller is destroyed
   */
  willDestroy() {
    this._super();
    this.get('disposableListeners').forEach((listener) => {
      let {subject, event, handler} = listener;
      subject.off(event, handler);
    });
  },

  /**
   * Add an event listener which will be automatically removed once this controller is destroyed
   * @param {Evented} subject Event emitter
   * @param {string} event Event name to listen to
   * @param {function} handler Listener handler function
   */
  addDisposableListener(subject, event, handler) {
    // Add the listener
    subject.on(event, handler);
    this.get('disposableListeners').push({subject, event, handler});
  },

  // CPs
  currentUser: readOnly('session.user'),
  userPermissions: readOnly('session.permissions'),
  inboxCount: readOnly('caseListTab.inboxCount.count'),
  viewingCaseViews: computed('routing.currentRouteName', function() {
    return this.get('routing.currentRouteName') === 'session.agent.cases.index.view';
  }),

  params: computed(function () {
    if (!variation('feature-push-notifications')) {
      return {};
    }

    const device = this.get('realtimePush').findRegisteredDevice(this.get('realtimePush').getPushUuid());
    if (device && device.get('id')) {
      return {
        device_id: device.get('id')
      };
    }
  }),

  hasInsightsAccess: computed('userPermissions', 'currentUser.role.roleType', function () {
    let currentUser = this.get('currentUser');

    if (currentUser) {
      return this.get('permissions').has('insights.access', currentUser);
    } else {
      return false;
    }
  }),

  pendingSteps: readOnly('onBoardingStatus.pendingSteps'),

  handleInboxCountChange(data) {
    this.get('store').push({
      data: {
        id: data.resource_id,
        type: dasherize(data.resource_type),
        attributes: data.changed_properties
      }
    });
  },

  actions: {
    seeMore(term) {
      this.send('openAdvancedSearch', term);
    },

    loadSearchRoute(...args) {
      this.send('openSearchResult', ...args);
    },

    close(tab) {
      this.get('tabStore').close(tab);
    },

    manageAppAccess() {
      this.set('appAccessModal', true);
    },

    closeAppAccessModal() {
      this.set('appAccessModal', false);
    },

    editSignature() {
      this.set('signatureModal', true);
    },

    closeSignatureModal() {
      this.set('signatureModal', false);
    },

    openTwoFactorModal() {
      this.set('twoFactorModal', true);
      this.set('twoFactorModalRole', 'enable');
    },

    openDisableTwoFactorModal() {
      this.set('twoFactorModal', true);
      this.set('twoFactorModalRole', 'disable');
    },

    closeTwoFactorModal() {
      this.set('twoFactorModal', false);
    },

    openPasswordModal() {
      this.set('changePasswordModal', true);
    },

    closePasswordModal() {
      this.set('changePasswordModal', false);
    },

    refreshUserData() {
      this.get('store').queryRecord('user', { id: 'me' });
    }
  }
});
