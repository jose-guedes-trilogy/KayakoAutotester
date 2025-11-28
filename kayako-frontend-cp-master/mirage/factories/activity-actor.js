import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  name: 'user',
  title: '',
  prefix: '@',
  url: '',
  full_title: '',
  image: 'http://fillmurray.com/100/100',
  preposition: 'of',
  original: null,
  resource_type: 'activity_actor'
});
