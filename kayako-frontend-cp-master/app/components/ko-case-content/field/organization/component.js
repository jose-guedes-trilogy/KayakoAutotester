import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { observer } from '@ember/object';
import { task } from 'ember-concurrency';

export default Component.extend({
  // Services
  store: service(),
  notification: service(),
  i18n: service(),

  init() {
    this._super(...arguments);
    if (this.get('user')) {
      this.get('loadOrganizations').perform();
    }
  },

  // Attributes
  qaClass: null,
  user: null,
  organizations: [],
  value: null,
  isEdited: false,
  isKREEdited: false,
  isErrored: false,
  isDisabled: false,
  isNewCase: false,
  onValueChange: null,

  userChanged: observer('user', function() {
    this.get('loadOrganizations').perform();
  }),

  loadOrganizations: task(function * () {
    const userId = this.get('user.id');
    if (!userId) { return; }
    
    try {
      const userOrgs = yield this.get('store').query('user-organization', { user_id: userId });
      this.set('organizations', userOrgs);
      
      // Only set default organization for new cases
      if (this.get('isNewCase') && !this.get('value') && userOrgs.get('length') > 0) {
        const primaryOrg = userOrgs.findBy('isPrimary', true) || userOrgs.get('firstObject');
        if (primaryOrg) {
          this.get('onValueChange')(primaryOrg.get('organization'));
        }
      }
    } catch (err) {
      this.get('notification').error(this.get('i18n').t('users.organization.load_error'));
    }
  }).drop()
});
