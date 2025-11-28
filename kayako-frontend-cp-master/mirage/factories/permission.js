import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  name: 'admin.random',
  value: true,
  resource_type: 'permission'
});
