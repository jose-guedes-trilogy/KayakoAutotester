import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  contents: '',
  resource_type: 'twitter_message',
});
