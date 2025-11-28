import DS from 'ember-data';
import MF from 'ember-data-model-fragments';

export default MF.Fragment.extend({
  type: DS.attr('string')          // ALL, TEAM, PRIVATE
});
