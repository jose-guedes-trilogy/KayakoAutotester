import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  from: faker.internet.email,
  to: faker.internet.email,
  sender: null,                   // is this mandatory?
  subject: faker.lorem.sentence,
  source: null,                   // I don't know what this field means
  text: faker.lorem.paragraphs,
  html: faker.lorem.paragraphs,
  is_suspended: false,
  status: 'RECEIVED',
  suspension_code: null,
  reason: null,                   // I don't know what this field means
  message_id: null,               // I don't know what this field means
  size: '123',                    // I don't know that this field means
  mailbox: null,                  // I don't know that this field means
  case: null,                     // I don't know that this field means
  case_post: null,                // I don't know that this field means
  time_taken: null,               // I don't know that this field means
  completed_at: null,             // I don't know that this field means
  created_at: () => new Date().toISOString(),
  resource_type: 'mail'
});
