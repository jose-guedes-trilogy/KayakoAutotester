import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: '',

  // Params
  organization: null,
  canDelete: false,
  filter: null,
  onSetFilter: () => {},
  closeTab: () => {},

  // Services
  session: service(),
  permissions: service(),
  confirmation: service(),

  // CPs
  hasDeleteOrganizationPermission: computed('session.permissions', 'organization', function() {
    return this.get('canDelete') && this.get('permissions').has('app.organization.delete', this.get('organization'));
  }),

  // Actions
  actions: {
    deleteOrganization() {
      return this.get('confirmation').confirm({ intlConfirmationBody: 'generic.confirm.delete'})
        .then(() => this.get('organization').destroyRecord())
        .then(() => this.get('closeTab')());
    }
  }
});
