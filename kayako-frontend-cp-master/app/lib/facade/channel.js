import EmberObject from '@ember/object';
import { computed } from '@ember/object';

export default EmberObject.extend({
  id: computed.readOnly('channel.id'),
  groupName: computed.readOnly('channel.groupName'),
  disabled: computed.readOnly('channel.disabled'),
  handle: computed.readOnly('channel.handle'),
  channelType: computed.readOnly('channel.channelType'),
  isOnline: false,

  shouldDeliverViaMessenger: computed('isOnline', 'normalizedType', function() {
    let isOnline = this.get('isOnline');
    let type = this.get('normalizedType');

    return (type === 'email') && isOnline;
  }),

  normalizedType: computed('channelType', function() {
    let channelType = this.get('channelType');

    switch (channelType) {
      case 'MAILBOX':
      case 'MAIL': {
        return 'email';
      }
      case 'FACEBOOK': {
        return 'facebook';
      }
      case 'TWITTER': {
        return 'twitter';
      }
    }
  })
});
