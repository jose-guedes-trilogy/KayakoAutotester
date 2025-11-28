import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  uuid: '02a60873-8118-453c-8258-8f44029e657d',
  service: 'STANDARD',
  encryption: 'NONE',
  address: 'support@brewfictus.com',
  prefix: null,
  smtp_type: null,
  host: null,
  port: null,
  username: null,
  preserve_mails: false,
  brand: null, // polymorphic belongsTo
  is_default: false,
  is_enabled: true,
  created_at: '2015-07-09T15:36:10Z',
  updated_at: '2015-07-09T15:36:10Z',
  resource_type: 'mailbox',
  resource_url: 'http://novo/api/index.php?/v1/mailboxes/1'
});
