import DS from 'ember-data';
import Postable from './postable';

export default Postable.extend({
  uuid: DS.attr('string'),
  type: DS.attr('string'),
  text: DS.attr('string'),
  event: DS.attr('string'),

  // Relations
  case: DS.belongsTo('case', { async: true }),
  from: DS.belongsTo('user-minimal', { async: false }),
  attachments: DS.hasMany('attachment', { async: false }),

  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),

  postType: 'chat',
  isMessage: true
});
