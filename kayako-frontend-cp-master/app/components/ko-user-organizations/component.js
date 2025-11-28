import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';

export default Component.extend({
  tagName: '',

  // Services
  store: service(),
  notification: service(),
  i18n: service(),

  // Attributes
  user: null,
  organizations: [],
  selectedOrganization: null,
  isOrganizationEdited: false,
  isOrganizationErrored: false,
  isOrganizationDisabled: false,

  init() {
    this._super(...arguments);
    this.get('loadOrganizations').perform();
  },

  loadOrganizations: task(function * () {
    const userId = this.get('user.id');
    if (!userId) { return; }
    
    try {
      const userAdapter = this.get('store').adapterFor('user');
      const result = yield userAdapter.fetchOrganizations(userId);
      const organizations = result.data.map(userOrg => {
        const orgId = userOrg.organization.id;
        return result.resources.organization[orgId];
      });
      this.set('organizations', organizations);
    } catch (err) {
      this.get('notification').error(this.get('i18n').t('users.organization.load_error'));
    }
  }).drop(),

  actions: {
    onOrganizationSelect(organization) {
      this.set('selectedOrganization', organization);
      this.sendAction('onOrganizationChange', organization);
    }
  }
});
