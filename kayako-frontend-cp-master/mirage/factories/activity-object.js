import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  name: null,
  title: null,
  prefix: '@',
  url: null,
  full_title: null,
  image: 'http://fillmurray.com/100/100',
  preposition: 'of',
  original: null,
  resource_type: 'activity_object'
});
