import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  is_primary: true,
  domain: (i) => `brew${i === 0 ? '' : i + 1}.com`,
  is_validated: false,
  created_at: '2015-07-09T15:36:10Z',
  updated_at: '2015-07-09T15:36:10Z',
  resource_type: 'identity_domain',
  resource_url: 'http://novo/api/index.php?/v1/identities/domains/1'
});
