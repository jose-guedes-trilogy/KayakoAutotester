import DS from 'ember-data';
import MF from 'ember-data-model-fragments';

export default MF.Fragment.extend({
  relationshipId: DS.attr('string'),
  relationshipType: DS.attr('string')
});
