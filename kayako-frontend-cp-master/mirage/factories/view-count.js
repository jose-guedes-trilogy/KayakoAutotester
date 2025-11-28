import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  count: null,
  count_accuracy: 'ABSOLUTE',
  realtime_channel: null,
  resource_type: 'view_count',
  resource_url: 'http://novo/api/index.php?/v1/views/counts/1',
  view: null
});
