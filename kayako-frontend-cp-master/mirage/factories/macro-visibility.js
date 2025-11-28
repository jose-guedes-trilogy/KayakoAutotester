import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  type: 'ALL',
  team: null,
  resource_type: 'macro_visibility'
});
