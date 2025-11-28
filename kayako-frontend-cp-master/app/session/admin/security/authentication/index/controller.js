import { inject as service } from '@ember/service';
import { readOnly, or } from '@ember/object/computed';
import Controller from '@ember/controller';
import { get, computed } from '@ember/object';
import settings from './settings';
import { task } from 'ember-concurrency';
import commaSeparateList from 'frontend-cp/lib/comma-separate-list';

export default Controller.extend({
  // Attributes
  settings: null,
  editedSettings: null,

  // State
  editedIpRestrictions: '',

  // Services
  i18n: service(),
  notification: service(),
  settingsService: service('settings'),
  virtualModel: service(),
  confirmation: service(),
  plan: service(),

  // CPs
  tabs: computed(function() {
    return [{
      id: 'case',
      label: this.get('i18n').t('admin.settings.security.tabs.agents'),
      routeName: 'session.admin.security.authentication.index',
      dynamicSegments: [],
      queryParams: null
    },
    {
      id: 'case',
      label: this.get('i18n').t('admin.settings.security.tabs.customers'),
      routeName: 'session.admin.security.authentication.customers',
      dynamicSegments: [],
      queryParams: null
    }];
  }),

  googleAppsSSO: computed(function () {
    return this.get('plan').has('sso_team_google_apps');
  }),

  authenticationModeOptions: computed(function () {
    return ['internal', 'jwt'];
  }),

  isSettingsEdited: readOnly('editedSettings.isEdited'),

  isGoogleDomainsEdited: computed('googleDomains.[]', 'editedGoogleDomains.[]', function () {
    let current = JSON.stringify(this.get('googleDomains'));
    let edited = JSON.stringify(this.get('editedGoogleDomains'));

    return current !== edited;
  }),

  isEdited: or('isSettingsEdited', 'isGoogleDomainsEdited'),

  schema: computed(function () {
    return this.get('settingsService').generateSchema(settings);
  }),

  init() {
    this._super(...arguments);
    this.googleDomains = [];
    this.editedGoogleDomains = [];
  },

  initEdits() {
    this.set('editedSettings', this.get('settingsService').initEdits(this.get('settings'), this.get('schema')));
    const googleDomains = this.get('editedSettings.security_agent_google_authentication_domain.value');
    const ipRestrictions = this.get('editedSettings.security_agent_ip_restriction.value');
    if (googleDomains) {
      const editedDomains = googleDomains.split(',').map(domain => ({ name: domain.trim() }));
      this.set('editedGoogleDomains', editedDomains);
      this.set('googleDomains', editedDomains.slice(0));
    }
    // Adding newline at the end so that when the field is activated, user can type straight
    // away to add a new entry
    this.set('editedIpRestrictions', ipRestrictions ? ipRestrictions.split(',').join('\n') + '\n' : ipRestrictions);
  },

  save: task(function * () {
    try {
      const googleDomains = this.get('editedGoogleDomains').map(domain => domain.name).join(',');
      this.set('editedSettings.security_agent_google_authentication_domain.value', googleDomains);

      yield this.get('virtualModel').save(this.get('settings'), this.get('editedSettings'), this.get('schema'));

      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });

      this.initEdits();
    } catch (e) {
      // intentional
    }
  }).drop(),

  cancel: task(function * () {
    if (this.get('isEdited')) {
      yield this.get('confirmation').confirm({
        intlConfirmationHeader: 'generic.confirm.lose_changes_header',
        intlConfirmationBody: 'generic.confirm.lose_changes',
        intlConfirmLabel: 'generic.confirm.lose_changes_button'
      });
      this.initEdits();
    }
  }).drop(),

  actions: {
    editBooleanSetting(settingName, value) {
      this.set(`editedSettings.${settingName}.value`, value ? '1' : '0');
    },

    editTextSetting(settingName, e) {
      this.set(`editedSettings.${settingName}.value`, e.target.value);
    },

    editSetting(settingName, value) {
      this.set(`editedSettings.${settingName}.value`, value);
    },

    addDomain(newDomain) {
      const name = get(newDomain, 'name');
      const editedDomains = this.get('editedGoogleDomains');
      if (editedDomains.find(domain => get(domain, 'name') === name)) {
        return;
      }
      editedDomains.pushObject({ name });
    },

    removeDomain(domain) {
      this.get('editedGoogleDomains').removeObject(domain);
    },

    setIpRestrictions(e) {
      const value = e.target.value;
      this.set('editedIpRestrictions', value);
      this.set('editedSettings.security_agent_ip_restriction.value', commaSeparateList(value));
    }
  }
});
