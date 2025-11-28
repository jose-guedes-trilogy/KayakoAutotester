import DS from 'ember-data';
import Identity from './identity';

export default Identity.extend({
  twitterId: DS.attr('string'),
  fullName: DS.attr('string'),
  screenName: DS.attr('string'),
  followerCount: DS.attr('number'),
  description: DS.attr('string'),
  url: DS.attr('string'),
  location: DS.attr('string'),
  profileImageUrl: DS.attr('string'),
  locale: DS.attr('string'),

  // Relations
  user: DS.belongsTo('user', { async: true }),

  // CPs
  canBeValidated: false
});
