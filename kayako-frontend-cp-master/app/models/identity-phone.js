import DS from 'ember-data';
import Identity from './identity';

export default Identity.extend({
  number: DS.attr('string'),

  // Relations
  user: DS.belongsTo('user', { async: true }),
  organization: DS.belongsTo('organization', { async: true }),

  canBeValidated: false
});
