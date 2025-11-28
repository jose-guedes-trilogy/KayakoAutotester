import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads, not } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';

function twitterHref(model) {
  if (model) {
    let screenName = get(model, 'original.screenName');
    let tweetId = get(model, 'original.id');

    if (screenName && tweetId) {
      return `https://twitter.com/${screenName}/status/${tweetId}`;
    }
  }

  return null;
}

export default Component.extend({
  tagName: '',

  model: null,
  showModal: false,

  windowService: service('window'),

  modelChannelType: reads('model.sourceChannel.channelType'),
  creatorIsCustomer: not('model.creator.role.isAgentOrHigher'),

  postIsEmailFromCustomer: computed('creatorIsCustomer', 'modelChannelType', function() {
    const creatorIsCustomer = this.get('creatorIsCustomer');
    const postType = this.get('modelChannelType');

    return creatorIsCustomer && (postType === 'MAIL' || postType === 'MAILBOX');
  }),

  postIsTwitter: computed('modelChannelType', 'href', function() {
    const postType = this.get('modelChannelType');
    const href = this.get('href');

    return postType === 'TWITTER' && href;
  }),

  href: computed('model.id', function() {
    let model = this.get('model');
    return twitterHref(model);
  }),

  actions: {
    openExternal(href, e) {
      e.preventDefault();
      e.stopPropagation();

      this.get('windowService').open(href, '', { width: '800', height: '500'});
    }
  }
});
