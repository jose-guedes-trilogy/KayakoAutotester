import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  name: () => `${faker.company.companyName()} ${faker.company.companySuffix()}`,
  is_shared: false,
  domains: () => [],
  phone: () => [],
  pinned_notes_count: 0,
  custom_fields: () => [],
  created_at: function() { return new Date(); },
  updated_at: function() { return this.created_at; },
  resource_type: 'organization',
  resource_url: 'http://novo/api/index.php?/v1/organizations/1'
});
