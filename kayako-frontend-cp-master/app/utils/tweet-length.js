import twitterText from 'npm:twitter-text';
import he from 'npm:he';

const TWEET_IMAGE_CHARS = 24;

export default function tweetLength(content, hasFiles) {
  let tweetContent = content.replace(/<a.+>(.+)<\/a>/g, '$1').replace(/<br>/g, '\n');
  tweetContent = he.unescape(tweetContent);
  let tweetLength = twitterText.getTweetLength(tweetContent.trim());
  if (hasFiles) {
    tweetLength += TWEET_IMAGE_CHARS;
  }
  return tweetLength;
}
