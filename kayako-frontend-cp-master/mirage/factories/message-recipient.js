import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  identity: {id: 2, resource_type: 'identity_email'},
  name: 'Caryn Pryor',
  resource_type: 'message_recipient',
  type: 'TO'
});
