import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  messages: [],

  sideConversationCreatorEmail: computed('messages.[]', function() {
    return this.get('messages.length') > 0 ? this.get('messages.0.message.creator.emails.0.email') : '';
  }),

  messagesWithRecipients: computed('messages.@each.message.recipients', function() {
    return this.get('messages').map(messageItem => {
      const toRecipients = messageItem.message.recipients.filter(recipient => recipient.type === 'TO');
      const ccRecipients = messageItem.message.recipients.filter(recipient => recipient.type === 'CC');
      let newMessageItem = Object.assign({}, messageItem);
      if (toRecipients.length === 0) {
        toRecipients.push({ identity: { email: this.get('sideConversationCreatorEmail') } });
      }
      newMessageItem.toRecipients = toRecipients;
      newMessageItem.ccRecipients = ccRecipients;
      if (newMessageItem.message.attachments) {
        newMessageItem.message.attachments = newMessageItem.message.attachments.map(attachment => {
          return Object.assign({}, attachment, {
            urlDownload: attachment.url_download 
          });
        });
      }
      return newMessageItem;
    });
  }),
});
