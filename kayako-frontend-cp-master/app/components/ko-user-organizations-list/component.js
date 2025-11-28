import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import { computed, observer } from '@ember/object';

export default Component.extend({
  classNames: ['ko-user-organizations-list'],

  // Services
  store: service(),
  notificationService: service('notification'),
  i18n: service(),
  confirmation: service(),

  // Attributes
  user: null,
  userOrganizations: null,
  canUpdateUser: true, // Default to true if not provided
  onUserChange: null, // Callback for when user data needs refresh
  disabled: false,
  
  // Computed Properties
  userOrganizationsList: computed('userOrganizations.[]', function() {
    return (this.get('userOrganizations').sortBy('isPrimary').reverseObjects() || []);
  }),
  
  init() {
    this._super(...arguments);
    this.set('userOrganizations', []);
    this.get('fetchOrganizations').perform();
  },

  // Observer to refresh organizations when user changes
  userDidChange: observer('user.id', function() {
    const userId = this.get('user.id');
    if (userId) {
      this.get('fetchOrganizations').perform();
    }
  }),

  fetchOrganizations: task(function * () {
    const userId = this.get('user.id');
    if (!userId) { return; }
    
    try {
      const userOrgs = yield this.get('store').query('user-organization', { user_id: userId });
      this.set('userOrganizations', userOrgs);
    } catch (err) {
      this.get('notificationService').error(this.get('i18n').t('generic.organizations.load_error'));
    }
  }).drop(),
  
  // Helper method to refresh organization list
  refreshOrganizations() {
    return this.get('fetchOrganizations').perform();
  },
  
  actions: {
    makePrimaryOrganization(userOrg) {
      if (!userOrg) {
        return;
      }
      
      const organization = userOrg.get('organization');
      const userId = this.get('user.id');
      const userOrgs = this.get('userOrganizations');
      
      // Set user relationship for API call
      userOrg.set('user', this.get('user'));
      
      // Optimistically update UI
      userOrgs.forEach(uo => uo.set('isPrimary', false));
      userOrg.set('isPrimary', true);
      
      // Make API call to update the primary status
      userOrg.save({ adapterOptions: { userId } })
        .then(() => {
          this.get('notificationService').success(
            this.get('i18n').t('organization.primary_set', { 
              name: this.get('user.fullName'), 
              org: organization.get('name') 
            })
          );
          
          this.refreshOrganizations();
          
          if (typeof this.get('onUserChange') === 'function') {
            this.get('onUserChange')();
          }
        })
        .catch(error => {
          this.get('notificationService').error(
            this.get('i18n').t('organization.primary_set_failed', { 
              org: organization.get('name') 
            })
          );
          this.refreshOrganizations();
        });
    },
    
    removeOrganization(userOrg) {
      if (!userOrg) { return; }
      
      const orgName = userOrg.get('organization.name');
      const userId = this.get('user.id');
      const userName = this.get('user.fullName');
      const i18n = this.get('i18n');
      
      // Show confirmation dialog before removing
      this.get('confirmation').confirm({
        intlConfirmationHeader: i18n.t('organization.confirm.remove_header'),
        intlConfirmationBody: i18n.t('organization.confirm.remove_body', { name: userName, org: orgName }),
        intlConfirmLabel: i18n.t('organization.confirm.remove_confirm'),
        isIntl: true
      })
      .then(() => {
        userOrg.set('user', this.get('user'));
        
        return userOrg.destroyRecord({ adapterOptions: { userId } });
      })
      .then(() => {
        this.get('notificationService').success(
          i18n.t('organization.removal_passed', { name: userName, org: orgName })
        );
        
        this.refreshOrganizations();
        
        if (typeof this.get('onUserChange') === 'function') {
          this.get('onUserChange')();
        }
      })
      .catch(error => {
        if (error) { // Only show error if not a cancel operation
          this.get('notificationService').error(i18n.t('organization.removal_failed'));
          this.refreshOrganizations();
        }
      });
    },
    
    saveOrganization(organization) {
      if (!organization || !organization.get('id')) { return; }
      
      const userId = this.get('user.id');
      const userName = this.get('user.fullName');
      const orgName = organization.get('name');
      const i18n = this.get('i18n');
      
      // Check if user already has this organization
      const existingUserOrg = this.get('userOrganizations').find(userOrg => 
        userOrg.get('organization.id') === organization.get('id')
      );
      
      if (existingUserOrg) {
        this.get('notificationService').error(i18n.t('organization.already_member', { 
          name: userName, org: orgName 
        }));
        return;
      }
      
      // Check if this is the first organization (should be primary)
      const isFirstOrg = this.get('userOrganizations.length') === 0;
      const adapter = this.get('store').adapterFor('user-organization');
      const url = `${adapter.namespace}/users/${userId}/organizations`;
      const payload = {
        organization: { id: organization.get('id') },
        isPrimary: isFirstOrg
      };
      
      // Make the API call
      adapter.ajax(url, 'POST', { data: payload })
        .then(() => {
          this.get('notificationService').success(i18n.t('organization.assignment_passed', { 
            name: userName, org: orgName 
          }));
          
          this.refreshOrganizations();
          
          if (typeof this.get('onUserChange') === 'function') {
            this.get('onUserChange')();
          }
        })
        .catch(error => {
          this.get('notificationService').error(i18n.t('organization.assignment_failed'));
        });
    },
    
    cancelOrganization() {},
  }
});
