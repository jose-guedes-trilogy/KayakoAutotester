import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  uuid: (i) => `case-message-${i}`,
  subject: (i) => `Subject ${i}`,
  body_text: 'Lorem ipsum dolor sit amet',
  body_html: '<em>Lorem ipsum</em> dolor sit amet',
  recipients: () => [],
  fullname: 'John Doe',
  email: (i) => `email${i}@gmail.com`,
  creator: null,
  identity: null,
  mailbox: null,
  attachments: () => [],
  location: null,

  creation_mode: null,
  locale: null,
  response_time: null,

  // Parent field
  case: null,

  post_type: 'message',
  resource_type: 'case_message'
});
