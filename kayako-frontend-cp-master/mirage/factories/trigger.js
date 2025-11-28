import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  title: i => `Trigger ${i}`,
  channel: null,
  event: null,
  predicate_collections: () => [],
  actions: () => [],
  executionOrder: 1,
  is_enabled: true,
  last_triggered_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  resource_type: 'trigger',
  execution_order: i => i
});
