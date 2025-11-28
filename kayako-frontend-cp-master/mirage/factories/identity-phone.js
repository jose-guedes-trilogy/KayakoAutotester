import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  created_at: '2015-08-27T11:02:47Z',
  is_primary: false,
  is_validated: false,
  number: i => `+44 ${4928581320 + i}`,
  resource_type: 'identity_phone',
  updated_at: '2015-08-27T11:02:47Z'
});
