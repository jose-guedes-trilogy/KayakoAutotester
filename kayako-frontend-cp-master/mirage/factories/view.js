import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  agent: null,
  columns: () => [],
  created_at: '2015-07-21T14:24:09Z',
  is_default: null,
  is_enabled: null,
  is_system: null,
  order_by: null,
  order_by_column: null,
  predicate_collections: () => [],
  resource_type: 'view',
  realtime_channel: null,
  resource_url: 'http://novo/api/index.php?/v1/views/1',
  sort_order: null,
  title: null,
  type: null,
  updated_at: '2015-07-21T14:24:09Z',
  visibility_to_teams: () => [],
  visibility_type: 'ALL'
});
