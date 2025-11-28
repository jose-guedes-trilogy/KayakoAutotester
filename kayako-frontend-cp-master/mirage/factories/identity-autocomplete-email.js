import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  identity: {
    id: i => i + 1,
    resource_type: 'identity_email'
  },
  parent: {
    id: i => i + 1,
    resource_type: 'user'
  }
});
