import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  label: i => `Action label ${i}`,
  name:  i => `Action name ${i}`,
  option: null,
  value: null,
  attributes: [],
  resource_type: 'automation_action'
});
