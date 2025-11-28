import MF from 'ember-data-model-fragments';
import attr from 'ember-data/attr';

export default MF.Fragment.extend({
  url: attr('string')
});
