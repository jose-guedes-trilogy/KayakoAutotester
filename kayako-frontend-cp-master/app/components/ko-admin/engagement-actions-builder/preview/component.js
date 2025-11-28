import Component from '@ember/component';
import { computed } from '@ember/object';
import { get } from '@ember/object';
import _ from 'npm:lodash';
import { inject as service } from '@ember/service';

export default Component.extend({
  // Attributes
  tagName: '',
  team: null,
  agent: null,
  message: null,

  // Services

  i18n: service(),

  // CPs
  messageText: computed('message', function() {
    if (this.get('message') === '' || this.get('message') === null || this.get('message.string') === '') {
      return this.get('i18n').t('admin.engagements.preview.message_placeholder');
    }
    return this.get('message');
  }),

  senderName: computed('team', 'agent', function() {
    if (this.get('agent')) {
      return this.get('agent.fullName');
    } else if (this.get('team')) {
      return this.get('team.title');
    } else {
      return this.get('i18n').t('admin.engagements.preview.sender_name_placeholder');
    }
  }),

  multipleAvatars: computed('avatars', function() {
    return this.get('avatars').length > 1;
  }),

  avatars: computed('team', 'agent', function() {
    if (this.get('agent')) {
      return [this.get('agent.avatar')];
    } else if (this.get('team')){
      const avatars = [];
      const members  = _.slice(this.get('team.members').toArray().filterBy('role.isAgentOrHigher', true).filterBy('isEnabled', true), 0, 3);
      /**
       * Get 3 avatars for team. If less than 3 members are available
       * use default login avatars.
       */

      members.forEach((member) => {
        avatars.push(get(member, 'avatar'));
      });
      _.times(3 - avatars.length, () => {
        avatars.push('/images/login/avatar.png');
      });
      return avatars;
    } else {
      return ['/images/login/avatar.png'];
    }
  })
});
