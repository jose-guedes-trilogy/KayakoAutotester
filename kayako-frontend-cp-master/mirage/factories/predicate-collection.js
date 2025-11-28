import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  propositions: () => [],
  resource_type: 'predicate_collection'
});
