import DS from 'ember-data';
import Postable from './postable';
import { or, alias } from '@ember/object/computed';

export default Postable.extend({
  uuid: DS.attr('string'),
  subject: DS.attr('string'),
  bodyText: DS.attr('string'),
  bodyHtml: DS.attr('string'),
  body: or('bodyHtml', 'bodyText'),
  contents: DS.attr('string'),
  attachmentFileIds: DS.attr('string'),

  isPinned: DS.attr('boolean'),
  color: DS.attr('string', { defaultValue: 'YELLOW' }), // TODO enum YELLOW, RED, GREEN, BLUE, ORANGE, PURPLE
  creator: DS.belongsTo('user', { async: false }),
  identity: DS.belongsTo('identity', { async: false }),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),

  organization: DS.belongsTo('organization', { async: false, inverse: 'notes' }),
  note: DS.belongsTo('note', { async: false }),
  post: DS.belongsTo('post', { async: true }),

  domains: alias('organization.domains'),

  postType: 'note'
});
