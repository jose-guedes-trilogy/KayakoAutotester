import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  event: '',
  properties: null,
  color: '',
  resource_type: 'event'
});
