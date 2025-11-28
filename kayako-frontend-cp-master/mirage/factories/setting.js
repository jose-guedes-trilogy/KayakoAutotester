import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  category: null,
  name: null,
  is_protected: false,
  value: null,
  resource_type: 'setting'
});
