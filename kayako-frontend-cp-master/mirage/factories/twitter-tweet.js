import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  uuid: (i) => `case-message-${i}`,
  attachments: () => [],
  contents: 'Blah',
  download_all: null,
  favorite_count: 0,
  full_name: 'John Doe',
  identity: null,
  in_reply_to_identity: null,
  in_reply_to_tweet: null,
  medis: () => [],
  retweet_count: null,
  screen_name: 'johnnydoe',

  resource_type: 'twitter_tweet',
  resource_url: 'https://support.kayakostage.net/api/v1/twitter/tweets/730010614920286208',
});
