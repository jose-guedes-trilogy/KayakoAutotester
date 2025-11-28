import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import MF from 'ember-data-model-fragments';

export default Model.extend({
  name: attr('string'),
  url: attr('string'),
  key: attr('string'),
  secret: attr('string'),
  scopes: attr('array'),
  description: attr('string'),
  author: attr('string'),
  author_url: attr('string'),
  logo: MF.fragment('oauth-client-logo', { async: false }),
  lastUsedAt: attr('date'),

  logoFileId: attr('string')
});
