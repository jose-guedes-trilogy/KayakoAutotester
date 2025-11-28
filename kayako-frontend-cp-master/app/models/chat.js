import DS from 'ember-data';
import Account from './account';

export default Account.extend({
  agent: DS.belongsTo('user', { async: true }),
  brand: DS.belongsTo('brand', { async: false }),
  createdAt: DS.attr('date'),
  creator: DS.belongsTo('user', { async: true }),
  email: DS.attr('string'),
  isProactive: DS.attr('boolean'),
  lastactivityAt: DS.attr('date'),
  name: DS.attr('string'),
  startedAt: DS.attr('date'),
  status: DS.attr('string'),
  subject: DS.attr('string'),
  team: DS.belongsTo('team', { async: true }),
  token: DS.attr('string'),
  uuid: DS.attr('string'),
  waitTime: DS.attr('number'),
  //This resource is returned from the posts endpoint for legacy chats
  //Being able to determine the model allows us to apply some specific behaviour
  //bodyhtml is all that is required from the old resource in addition to what is
  //above to render the message correctly on the timeline
  isLegacyPostType: true,
  bodyHtml: DS.attr('string')
});
