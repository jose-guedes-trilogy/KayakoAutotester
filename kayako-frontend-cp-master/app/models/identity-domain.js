import DS from 'ember-data';
import Identity from './identity';

export default Identity.extend({
  domain: DS.attr('string'),

  user: DS.belongsTo('user', { async: true }),
  organization: DS.belongsTo('organization', { async: true })
});
