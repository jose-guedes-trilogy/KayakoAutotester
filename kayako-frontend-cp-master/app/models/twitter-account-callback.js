import DS from 'ember-data';

export default DS.Model.extend({
  oauthToken: DS.attr('string'),
  oauthVerifier: DS.attr('string'),

  account: DS.belongsTo('twitter-account')
});
