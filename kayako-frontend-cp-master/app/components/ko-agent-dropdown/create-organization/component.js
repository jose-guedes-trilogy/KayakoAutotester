import { inject as service } from '@ember/service';
import Component from '@ember/component';
import EmberObject, { get, computed } from '@ember/object';

export default Component.extend({
  // Attributes
  onCreate: () => {},
  onCancel: () => {},

  // State
  fields: null,
  organization: null,

  // Services
  store: service(),

  // CPs
  domains: computed('fields.domains.value.[]', function () {
    return this.get('fields.domains.value').map(domain => ({
      name: domain.get('domain')
    }));
  }),

  init() {
    this._super();
    this.set('organization', this.get('store').createRecord('organization'));

    this.set('fields', EmberObject.create({
      domains: {
        value: []
      }
    }));
  },

  actions: {
    addDomain(domain) {
      let domainRecord = this.get('store').createRecord('identity-domain', { domain: get(domain, 'name') });
      this.get('fields.domains.value').pushObject(domainRecord);
    },

    removeDomain(domain) {
      const domainName = get(domain, 'name');
      this.get('fields.domains.value').removeObject(
        this.get('fields.domains.value').find(domain => get(domain, 'domain') === domainName)
      );
    },

    submit() {
      const organization = this.get('organization');
      const onSubmit = this.get('onSubmit');
      organization.set('domains', this.get('fields.domains.value'));
      if (onSubmit) { onSubmit(); }
      return organization.save().then(organization => {
        organization.set('domains', organization.get('domains').filter(domain => domain.get('id')));
        this.get('dropdown.actions').close();

        return organization;
      });
    }
  }
});
