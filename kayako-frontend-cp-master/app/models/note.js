import DS from 'ember-data';
import Postable from './postable';
import { or } from '@ember/object/computed';

export default Postable.extend({
  bodyText: DS.attr('string'),
  bodyHtml: DS.attr('string'),
  body: or('bodyHtml', 'bodyText'),
  contents: DS.attr('string'),
  isPinned: DS.attr('boolean'),
  pinnedBy: DS.belongsTo('user', { async: false }),
  attachments: DS.hasMany('attachment', { async: true }),
  attachmentFileIds: DS.attr('string'),
  downloadAll: DS.attr('string'),

  user: DS.belongsTo('user', { async: true }),
  parent: DS.belongsTo('case', { async: true, polymorphic: true }),

  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),
  resourceUrl: DS.attr('string'),

  isAiDraft: DS.attr('boolean'),
  noteType: DS.attr('string'),

  postType: 'note'
});
