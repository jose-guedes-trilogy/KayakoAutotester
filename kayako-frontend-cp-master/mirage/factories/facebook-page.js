import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  uuid: 'fake-XXXX-default',
  is_enabled: true,
  resource_type: 'facebook_page',
  resource_url: 'http://novo/api/index.php?/v1/facebook/page/1',
  route_messages: true,
  route_posts: true,
  title: 'HelpDesk Management System',
  created_at: '2015-08-05T06:13:59Z',
  updated_at: '2015-08-05T06:13:59Z'
});
