import DS from 'ember-data';
import { computed } from '@ember/object';

export const POST_STATUS_NOT_SENT = 'NOT_SENT';
export const POST_STATUS_SENT = 'SENT';
export const POST_STATUS_DELIVERED = 'DELIVERED';
export const POST_STATUS_SEEN = 'SEEN';
export const POST_STATUS_REJECTED = 'REJECTED';

export const POST_STATUS_CLIENT_WAITING = 'CLIENT_WAITING';
export const POST_STATUS_CLIENT_SENDING = 'CLIENT_SENDING';
export const POST_STATUS_CLIENT_FAILED = 'CLIENT_FAILED';

export default DS.Model.extend({
  uuid: DS.attr('string'),
  clientId: DS.attr('string'),
  subject: DS.attr('string'),
  contents: DS.attr('string'),
  creator: DS.belongsTo('post-creator', { async: false, polymorphic: true }),
  sourceChannel: DS.belongsTo('channel', { async: false }),
  identity: DS.belongsTo('identity', { async: false }),
  attachments: DS.hasMany('attachment', { async: true }),
  downloadAll: DS.attr('string'),
  original: DS.belongsTo('postable', { async: true, polymorphic: true }),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),
  metadata: DS.attr(),
  destinationMedium: DS.attr('string'), // MAIL / MESSENGER / null

  // NOT_SENT > SENT > DELIVERED > SEEN > REJECTED
  postStatus: DS.attr('string'),
  postStatusRejectReason: DS.attr('string'),
  postStatusUpdatedAt: DS.attr('date'),

  // Virtual parent field
  parent: DS.belongsTo('has-posts', { async: true, polymorphic: true }),

  // CP's
  isViaMessenger: computed('sourceChannel', 'destinationMedium', function() {
    return this.get('sourceChannel.channelType') === 'MESSENGER' || this.get('destinationMedium') === 'MESSENGER';
  }),

  isViaEmail: computed('isViaMessenger', 'original', function() {
    return !this.get('isViaMessenger') && this.get('original.postType') === 'message';
  })
});
