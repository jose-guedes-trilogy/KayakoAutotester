import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  name: 'note',
  title: 'Hello World',
  prefix: '',
  url: 'https://brewfictus.kayako.com/Base/Note/View/1',
  full_title: 'Hello World',
  image: '',
  preposition: null,
  original: null,
  resource_type: 'activity_result'
});
