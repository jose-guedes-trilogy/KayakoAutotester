import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  name: attr('string'),
  option: attr('string'),
  value: attr(),
  attributes: attr()
});
