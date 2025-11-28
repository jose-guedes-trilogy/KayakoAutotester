import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  body_text: 'Test',
  body_html: '<h3<Test</h3>',
  color: 'YELLOW',
  is_pinned: false,
  attachments: () => [],
  download_all: null,
  user: null,
  post_type: 'note',
  resource_type: 'note',
  resource_url: 'https://brewfictus.kayako.com/api/v1/...',
  created_at: () => new Date(),
  updated_at: () => new Date()
});
