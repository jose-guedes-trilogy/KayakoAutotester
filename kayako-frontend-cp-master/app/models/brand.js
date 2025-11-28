import DS from 'ember-data';

let { attr, Model, belongsTo, hasMany } = DS;

export default Model.extend({
  alias: attr('string', { defaultValue: '' }),
  domain: attr('string', { defaultValue: '' }),
  subDomain: attr('string', { defaultValue: '' }),
  name: attr('string', { defaultValue: '' }),
  url: attr('string'),
  sslCertificate: attr('string', { defaultValue: '' }),
  isSslEnabled: attr('boolean'),
  privateKey: attr('string', { defaultValue: '' }),
  locale: belongsTo('locale', { async: false }),
  isEnabled: attr('boolean'),
  isDefault: attr('boolean'),
  mailboxes: hasMany('mailbox'),

  createdAt: attr('date'),
  updatedAt: attr('date')
});
