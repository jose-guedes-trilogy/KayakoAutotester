import DS from 'ember-data';
import MF from 'ember-data-model-fragments';

export default MF.Fragment.extend({
  name: DS.attr('string'),
  title: DS.attr('string'),
  prefix: DS.attr('string'),
  url: DS.attr('string'),
  fullTitle: DS.attr('string'),
  image: DS.attr('string'),
  preposition: DS.attr('string')
});
