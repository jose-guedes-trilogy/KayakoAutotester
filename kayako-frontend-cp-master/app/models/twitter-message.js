import DS from 'ember-data';
import Postable from './postable';

let { attr } = DS;

export default Postable.extend({
  uuid: attr('string'),
  attachments: DS.hasMany('attachment', { async: false }),
  contents: DS.attr('string'),
  downloadAll: DS.attr('string'),
  messsageId: DS.attr('string'),

  recipient: DS.belongsTo('identity-twitter', { async: false }),
  sender: DS.belongsTo('identity-twitter', { async: false }),

  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),

  postType: 'twitterMessage',
  isMessage: true
});
