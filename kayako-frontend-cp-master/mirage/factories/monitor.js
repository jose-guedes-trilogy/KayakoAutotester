import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  title: i => `Monitor ${i}`,
  predicate_collections: () => [],
  actions: () => [],
  execution_order: i => i,
  is_enabled: true,
  last_executed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  resource_type: 'monitor'
});
