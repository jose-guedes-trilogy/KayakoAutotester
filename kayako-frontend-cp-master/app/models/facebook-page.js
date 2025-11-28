import DS from 'ember-data';
import Account from './account';

export default Account.extend({
  title: DS.attr('string'),
  account: DS.belongsTo('facebook-account'),
  brand: DS.belongsTo('brand', { async: false }),
  routePosts: DS.attr('boolean'),
  routeMessages: DS.attr('boolean'),
  isEnabled: DS.attr('boolean'),
  status: DS.attr('string'),

  import: false
});
