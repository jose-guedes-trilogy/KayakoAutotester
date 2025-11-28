import DS from 'ember-data';
import { computed } from '@ember/object';
import Identity from './identity';

export default Identity.extend({
  facebookId: DS.attr('string'),
  userName: DS.attr('string'),
  fullName: DS.attr('string'),
  email: DS.attr('string'),
  bio: DS.attr('string'),
  birthDate: DS.attr('date'),
  website: DS.attr('string'),
  profileUrl: DS.attr('string'),
  locale: DS.attr('string'),

  // Relations
  user: DS.belongsTo('user', { async: true }),

  // CPs
  name: computed.or('userName', 'fullName'),

  canBeValidated: false
});
