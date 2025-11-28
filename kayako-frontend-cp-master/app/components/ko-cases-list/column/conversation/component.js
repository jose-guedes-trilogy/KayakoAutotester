import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import he from 'npm:he';

export default Component.extend({
  tagName: '',

  // Attributes
  isLoading: false,
  model: null,

  _casePresence: null,

  // Services
  i18n: service(),
  session: service(),

  // CPs
  caseChannel: computed.alias('model.realtimeChannel'),

  subject: computed('model.subject', '_requesterIsTyping', function() {
    let requesterIsTyping = this.get('_requesterIsTyping');
    let caseSubject = he.unescape(this.get('model.subject'));

    if (requesterIsTyping) {
      return this.get('i18n').t('cases.realtimeTyping', {
        total: 1,
        sentence: ''
      });
    }

    return caseSubject;
  }),

  lastMessagePreview: computed('model.lastMessagePreview', function() {
    let content = '';
    if (this.get('model.lastMessagePreview')) {
      content =  he.unescape(this.get('model.lastMessagePreview'));
    }

    return content;
  }),

  lastRepliedAt: computed('model.lastRepliedAt', 'model.lastReplier.fullName', function () {
    const i18n = this.get('i18n');
    const date = i18n.formatDate(this.get('model.lastRepliedAt'), { format: 'LLL' });
    return i18n.t('cases.last_reply_by_at', {
      by: this.get('model.lastReplier.fullName'),
      at: date
    });
  }),

  hasUnreadMessages: computed('model.readMarker.unreadCount', function() {
    let hasUnreadMessages = this.get('model.readMarker.unreadCount') === undefined || this.get('model.readMarker.unreadCount') > 0;
    return hasUnreadMessages;
  }),

  _requesterIsTyping: computed('_casePresence', 'model.requester', 'session.user', function() {
    const data = this.get('_casePresence');
    if (!data) { return false; }

    const id = this.get('model.requester.id');
    const loggedInUserId = this.get('session.user.id');

    if (id === loggedInUserId) { return false; }

    const metas = (data[id] && data[id].metas) || [];

    return metas.filterBy('is_typing', true).length > 0;
  })
});
