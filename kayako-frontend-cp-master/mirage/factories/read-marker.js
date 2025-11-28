import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  last_read_post_id: null,
  last_read_at: null,
  unread_count: 0,
  resource_type: 'read_marker'
});
