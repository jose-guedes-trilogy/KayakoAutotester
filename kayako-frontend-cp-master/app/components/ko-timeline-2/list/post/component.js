import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import activityFacade from 'frontend-cp/lib/facade/activity';
import { computed } from '@ember/object';

export default Component.extend({
  // Attrs
  tagName: '',

  activity: reads('post.original'),
  post: null,
  posts: null,
  isLastReadPost: false,
  canResend: true,
  isItemMenuOpen: false,
  onResend: () => {},
  onItemMenuOpen: () => {},

  // CPs
  isMessageOrNote: computed('post.original.postType', function() {
    let postType = this.get('post.original.postType');
    return ['message', 'note'].includes(postType);
  }),

  activityFacade: computed('activity', function() {
    if (this.get('activity.isActivity')) {
      return new activityFacade({ activity: this.get('activity')});
    }
  })
});
