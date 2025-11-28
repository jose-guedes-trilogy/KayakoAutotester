import DS from 'ember-data';
import Account from './account';

export default Account.extend({
  twitterId: DS.attr('string'),
  screenName: DS.attr('string'),
  brand: DS.belongsTo('brand', { async: false }),
  routeMentions: DS.attr('boolean'),
  routeMessages: DS.attr('boolean'),
  routeFavorites: DS.attr('boolean'),
  showInHelpCenter: DS.attr('boolean'),
  status: DS.attr('string'),
  isEnabled: DS.attr('boolean'),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date')
});
