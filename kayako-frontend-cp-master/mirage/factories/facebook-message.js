import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  contents: null,
  resource_type: 'facebook_message'
});
