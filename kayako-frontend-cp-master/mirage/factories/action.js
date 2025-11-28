import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  action: '',
  field: '',
  old_value: '',
  new_value: '',
  old_object: null,
  new_object: null,
  resource_type: 'action'
});
