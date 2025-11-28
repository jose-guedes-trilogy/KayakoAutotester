import DS from 'ember-data';
import Postable from './postable';

export default Postable.extend({
  uuid: DS.attr('string'),
  subject: DS.attr('string'),
  contents: DS.attr('string'),
  isPinned: DS.attr('boolean'),
  color: DS.attr('string', { defaultValue: 'YELLOW' }), // TODO enum YELLOW, RED, GREEN, BLUE, ORANGE, PURPLE
  creator: DS.belongsTo('user', { async: false }),
  identity: DS.belongsTo('identity', { async: false }),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),

  case: DS.belongsTo('case', { async: false }),
  note: DS.belongsTo('note', { async: false }),
  post: DS.belongsTo('post', { async: true })
});
