import MF from 'ember-data-model-fragments';
import attr from 'ember-data/attr';

export default MF.Fragment.extend({
  name: attr('string'),
  url: attr('string'),
  description: attr('string'),
  author: attr('string'),
  author_url: attr('string'),
  logo: MF.fragment('my-oauth-client-logo', { async: false })
});
