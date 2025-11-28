import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  title: '00 Support \\ 00 Welcome',
  reply_type: null,
  reply_contents: 'Hello, thank you for contacting Kayako.',
  agent: {},
  assignee: {},
  properties: {},
  visibility: {},
  tags: () => [],
  usage_count: 0,
  last_used_at: null,
  created_at: null,
  updated_at: null,
  type: null,
  resource_type: 'macro',
  resource_url: 'http://support.kayakodev.net/api/v1/cases/macros/499'
});
