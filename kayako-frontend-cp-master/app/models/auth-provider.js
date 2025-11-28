import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  scheme: attr('string'),
  loginUrl: attr('string'),
  logoutUrl: attr('string')
});
