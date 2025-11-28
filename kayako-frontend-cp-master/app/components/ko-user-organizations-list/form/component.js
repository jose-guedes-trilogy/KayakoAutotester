import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { task, timeout } from 'ember-concurrency';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',
  
  // Services
  store: service(),
  i18n: service(),
  notificationService: service('notification'),
  
  // Attributes
  disabled: false,
  qaClass: '',
  showForm: false,
  organization: null,
  errors: null,
  
  // Actions
  save() {},
  cancel() {},
  
  searchOrganizations: task(function* (term) {
    if (term.length < 2) {
      return [];
    }
    
    // Add debounce to prevent excessive API calls
    yield timeout(300);
    
    try {
      return this.get('store').query('organization', { name: term }).then(results => {
        return results.toArray();
      });
    } catch (error) {
      return [];
    }
  }).restartable(),
  
  placeholder: computed('i18n', function() {
    return this.get('i18n').t('organization.search_organizations');
  }),
  
  actions: {
    showAddForm() {
      this.set('showForm', true);
    },
    
    selectOrganization(organization) {
      if (!organization) return;
      this.set('organization', organization);
    },
    
    addOrganization() {
      const organization = this.get('organization');
      if (organization) {
        this.get('save')(organization);
        this.set('organization', null);
        this.set('showForm', false);
      }
    },
    
    cancel() {
      this.set('organization', null);
      this.set('showForm', false);
      this.get('cancel')();
    }
  }
});
