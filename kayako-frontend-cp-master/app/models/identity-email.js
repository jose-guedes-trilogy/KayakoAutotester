import DS from 'ember-data';
import Identity from './identity';

export default Identity.extend({
  email: DS.attr('string'),
  isNotificationEnabled: DS.attr('string'),
  // Relations
  user: DS.belongsTo('user', { async: true })
});
