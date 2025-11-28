import { computed } from '@ember/object';
import DS from 'ember-data';

export default DS.Model.extend({
  channelType: DS.attr('string'),
  characterLimit: DS.attr('number'),
  account: DS.belongsTo('account', { polymorphic: true, async: false }),

  isChannelTypeMailbox: computed('channelType', function() {
    return ['MAILBOX', 'MAIL'].indexOf(this.get('channelType')) > -1;
  }),

  handle: computed('channelType', function() {
    let channelType = this.get('channelType');
    switch (channelType) {
      case 'MAILBOX':
      case 'MAIL': {
        return this.get('account.address');
      }
      case 'FACEBOOK': {
        return `${this.get('account.title')} - Message`;
      }
      case 'TWITTER': {
        return `${this.get('account.screenName')} - Tweet`;
      }
      case 'TWITTER_DM': {
        return `${this.get('account.screenName')} - DM`;
      }
    }
  })
});
