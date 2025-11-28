import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  uuid: (i) => { return i + 1; },
  account: null,
  type: 'MAIL',
  resource_type: 'channel'
});
