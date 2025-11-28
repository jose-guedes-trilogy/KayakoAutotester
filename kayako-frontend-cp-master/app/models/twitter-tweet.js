import DS from 'ember-data';
import Postable from './postable';

export default Postable.extend({
  uuid: DS.attr('string'),
  tweetId: DS.attr('string'),
  attachments: DS.hasMany('attachment', { async: false }),
  contents: DS.attr('string'),
  screenName: DS.attr('string'),
  downloadAll: DS.attr('string'),
  favoriteCount: DS.attr('number'),
  retweetCount: DS.attr('number'),
  fullName: DS.attr('string'),

  identity: DS.belongsTo('identity', { async: false }),
  inReplyToIdentity: DS.belongsTo('identity', { async: false }),
  inReplyToTweet: DS.belongsTo('twitter-tweet', { async: false }),

  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),

  postType: 'twitterTweet',
  isMessage: true
});
