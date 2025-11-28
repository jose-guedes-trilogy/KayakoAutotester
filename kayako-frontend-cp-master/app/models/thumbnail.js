import DS from 'ember-data';
import MF from 'ember-data-model-fragments';

export default MF.Fragment.extend({
  name: DS.attr('string'),
  size: DS.attr('number'),
  width: DS.attr('number'),
  height: DS.attr('number'),
  url: DS.attr('string'),
  createdAt: DS.attr('date')
});
