import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  article: null,

  count: computed.readOnly('article.upvote_count')
});
