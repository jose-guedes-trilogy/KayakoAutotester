import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  text: null,
  resource_type: 'chat_message'
});
