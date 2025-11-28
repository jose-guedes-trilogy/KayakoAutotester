import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  name: null,
  events: [],
  resource_type: 'trigger-channel'
});
