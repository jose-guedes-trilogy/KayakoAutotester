import DS from 'ember-data';
import MF from 'ember-data-model-fragments';

export default MF.Fragment.extend({
  cc: DS.attr('array'),
  mentions: DS.attr('array'),
  html: DS.attr('boolean'),
  type: DS.attr('string')
});
