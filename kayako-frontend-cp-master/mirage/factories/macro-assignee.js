import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  type: null,
  team: null,
  agent: null,
  resource_type: 'macro_assignee'
});
