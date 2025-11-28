import Component from '@ember/component';
import { computed } from '@ember/object';
import {
  POST_STATUS_CLIENT_FAILED,
  POST_STATUS_NOT_SENT,
  POST_STATUS_SENT,
  POST_STATUS_DELIVERED,
  POST_STATUS_SEEN,
  POST_STATUS_REJECTED
} from 'frontend-cp/models/post';

export default Component.extend({
  tagName: '',

  status: null,
  tooltip: true,

  icon: computed('status', function() {
    switch (this.get('status')) {
      case POST_STATUS_CLIENT_FAILED:
        return 'post-status/Failed';

      case POST_STATUS_NOT_SENT:
        return 'post-status/Not Sent';

      case POST_STATUS_SENT:
        return 'post-status/Sent';

      case POST_STATUS_DELIVERED:
        return 'post-status/Delivered';

      case POST_STATUS_SEEN:
        return 'post-status/Seen';

      case POST_STATUS_REJECTED:
        return 'post-status/Rejected';

      default:
        return null;
    }
  })
});
