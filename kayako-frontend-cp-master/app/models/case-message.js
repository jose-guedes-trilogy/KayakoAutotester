import DS from 'ember-data';
import Postable from './postable';

export default Postable.extend({
  uuid: DS.attr('string'),
  subject: DS.attr('string'),
  bodyText: DS.attr('string'),
  bodyHtml: DS.attr('string'),
  fullname: DS.attr('string'),
  email: DS.attr('string'),
  creationMode: DS.attr('string'),
  locale: DS.attr('string'),
  responseTime: DS.attr('number'),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),

  // Relations
  case: DS.belongsTo('case', { async: true }),
  creator: DS.belongsTo('user', { async: true }),
  identity: DS.belongsTo('identity', { async: true }),
  mailbox: DS.belongsTo('mailbox', { async: true }),
  location: DS.belongsTo('location', { async: true }),

  recipients: DS.hasMany('message-recipient', { async: true }),
  attachments: DS.hasMany('attachment', { async: true }),

  postType: 'message',
  isMessage: true
});
