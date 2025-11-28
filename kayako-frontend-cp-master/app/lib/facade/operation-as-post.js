import EmberObject from '@ember/object';
import { computed } from '@ember/object';
import { readOnly } from '@ember/object/computed';

import {
  OP_STATE_WAITING,
  OP_STATE_SENDING,
  OP_STATE_FAILED
} from 'frontend-cp/state-managers/case';
import {
  POST_STATUS_CLIENT_WAITING,
  POST_STATUS_CLIENT_SENDING,
  POST_STATUS_CLIENT_FAILED
} from 'frontend-cp/models/post';

export default EmberObject.extend({
  key: 'root',
  operation: null,

  id: null,
  isNew: true,
  createdAt: readOnly('operation.createdAt'),
  destinationMedium: computed('operation.meta.shouldDeliverViaMessenger', 'operation.attrs.channelType', function() {
    let channelType = this.get('operation.attrs.channelType');
    let shouldDeliverViaMessenger = this.get('operation.meta.shouldDeliverViaMessenger');

    if (channelType !== 'MAIL') {
      return null;
    }

    if (shouldDeliverViaMessenger) {
      return 'MESSENGER';
    }

    return 'MAIL';
  }),
  metadata: null,
  postStatus: computed('operation.state', function() {
    switch (this.get('operation.state')) {
    case OP_STATE_WAITING:
      return POST_STATUS_CLIENT_WAITING;
    case OP_STATE_SENDING:
      return POST_STATUS_CLIENT_SENDING;
    case OP_STATE_FAILED:
      return POST_STATUS_CLIENT_FAILED;
    }
  }),
  postRateLimited: computed('operation.error', function () {
    if (this.get(`operation.error.errors.${0}.code`) === 'RATE_LIMIT_REACHED') {
      return true;
    }

    return false;
  }),
  postStatusUpdatedAt: readOnly('operation.createdAt'),
  attachments: computed(function() {
    let attachmentFileIds = this.get('operation.attrs.attachmentFileIds') || [];
    let attachments = this.get('operation.attrs.attachments');
    return attachmentFileIds.map(id => {
      return EmberObject.create({
        id,
        size: attachments.findBy('attachmentId', id).get('size'),
        name: attachments.findBy('attachmentId', id).get('name'),
        thumbnails: []
      });
    });
  }),

  contents: readOnly('operation.attrs.contents'),

  original: computed(function() {
   return EmberObject.create({
     isActivity: false,
     activity: null,
     actions: null,
     postType: postTypeFor(this.get('operation.attrs.channelType')),
     apiEvent: null,
     isLegacyPostType: false,
     isPinned: null,
     note: null,
     bodyHtml: this.get('operation.attrs.contents'),
     recipients: [],
     email: null
   });
  }),

  sourceChannel: computed(function() {
    return EmberObject.create({
      channelType: this.get('operation.attrs.channelType')
    });
  })
});

function postTypeFor(channelType) {
  switch (channelType) {
    case 'MAIL':
      return 'message';
    case 'TWITTER':
      return 'twitterTweet';
    case 'FACEBOOK':
      return 'facebookMessage';
    case 'NOTE':
      return 'note';
  }
}
