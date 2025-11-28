import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  category: attr('string'),
  name: attr('string'),
  isProtected: attr('boolean'),
  value: attr('string')
});
