import Component from '@ember/component';
import { computed } from '@ember/object';

/**
 * @class KoUserOrganizationsListOrganization
 * @namespace Components
 * @extends Ember.Component
 * @public
 */
export default Component.extend({
  tagName: '',

  // Dependencies
  i18n: Ember.inject.service(),

  // Properties
  organization: null,
  userOrg: null,
  index: null,
  canUpdateUser: true, // Default to true if not provided
  onMakePrimary: null,
  onRemoveOrganization: null,

  // CPs
  options: computed('userOrg.isPrimary', function () {
    const i18n = this.get('i18n');
    let options = [];
    if (!this.get('userOrg.isPrimary')) {
      options.push({
        label: i18n.t('generic.identities.make_primary'), 
        id: 'make_primary'
      });
    }
    
    // Always add the remove option
    options.push({
      label: i18n.t('generic.remove'),
      id: 'remove'
    });
    
    return options;
  }),

  actions: {
    selectItem(item) {
      const userOrg = this.get('userOrg');
      if (item.id === 'make_primary') {
        this.get('onMakePrimary')(userOrg);
      } else if (item.id === 'remove') {
        this.get('onRemoveOrganization')(userOrg);
      }
    }
  }
});
