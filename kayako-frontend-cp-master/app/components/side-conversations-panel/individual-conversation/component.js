import Component from '@ember/component';
import { observer, computed } from '@ember/object';
import { task, timeout } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { isBlank } from '@ember/utils';
import { validateEmailFormat } from 'frontend-cp/utils/format-validations';
import EmberObject from '@ember/object';
import KeyboardShortcuts from 'ember-keyboard-shortcuts/mixins/component';
import { next } from '@ember/runloop';

export default Component.extend(KeyboardShortcuts, {
  tagName: '',

  // Services
  store: service(),
  sessionService: service('session'),
  uploadService: service('fileUpload'),
  i18n: service(),
  notification: service(),

  // Attributes
  isNew: false,
  toEmails: [],
  ccEmails: [],
  emailContent: '',
  subject: '',
  errors: {},
  isSending: false,
  attachments: [],
  case: null,
  loadedConversation: null,
  upladingFiles: false,

  keyboardShortcuts: {
    'mod+enter': {
      action: 'send',
      global: true,
      preventDefault: true
    }
  },

  title: computed('currentConversation', 'loadedConversation', 'isNew', function() {
    if (this.get('isNew')) {
      return this.get('i18n').t('cases.side_conversations.new_conversation'); 
    } else {
      const subject = this.get('currentConversation.filteredSubject') || this.get('loadedConversation.0.message.subject') || this.get('subject');
      return subject.replace(/\[SC-\d+\]/g, '').trim();
    }
  }),

  subtitle: computed('currentConversation', function() {
    return '';
  }),

  status: computed('currentConversation.status', function() {
    return this.get('currentConversation.status');
  }),

  isConversationClosed: computed('status', 'isNew', function() {
    if (this.get('isNew')) {
      return false;
    }
    return this.get('status') !== 'open';
  }),

  actionButtonText: computed('isConversationClosed', function() {
    return this.get('isConversationClosed')
      ? this.get('i18n').t('cases.side_conversations.reopen')
      : this.get('i18n').t('cases.side_conversations.mark_close');
  }),

  isSendDisabled: computed('toEmails', 'ccEmails', 'emailContent', 'subject', 'uploadingFiles', function() {
    const hasValidToEmails = this.get('toEmails').every(email => validateEmailFormat(email));
    const hasValidCCEmails = this.get('ccEmails').every(email => validateEmailFormat(email));
    const hasContent = !isBlank(this.get('emailContent'));
    const isUploadingFiles = this.get('uploadingFiles');

    if (this.get('isNew')) {
      const hasSubject = !isBlank(this.get('subject'));
      return !(hasValidToEmails && hasValidCCEmails && hasContent && hasSubject) || isUploadingFiles;
    } else {
      return !(hasValidToEmails && hasValidCCEmails && hasContent) || isUploadingFiles;
    }
  }),

  suggestPeople: task(function * (address) {
    const mailboxAddresses = this.get('store').peekAll('channel').filterBy('isChannelTypeMailbox').getEach('handle');
    const trimmedAddress = address.trim();
    const isAMailboxAddress = mailboxAddresses.includes(trimmedAddress);

    if (isBlank(trimmedAddress) || isAMailboxAddress) {
      return [];
    }
    yield timeout(300);
    const selectedPeople = [...this.get('toEmails'), ...this.get('ccEmails')];
    const idsToExclude = [...selectedPeople, ...mailboxAddresses];

    const data = yield this.get('store').query('identity-autocomplete-email', {
      address: trimmedAddress
    });

    // Remove any already selected or mailbox emails from results list
    const results = data.filter(
      autocomplete => !idsToExclude.includes(autocomplete.get('identity.email'))
    );

    const isValidEmail = validateEmailFormat(trimmedAddress);
    const enteredCcIsNotSelectedOrMailboxEmail = !idsToExclude.includes(trimmedAddress);
    const autocompleteResultIsNotTheSameAsEnteredCc = !results.mapBy('identity.email').includes(trimmedAddress);

    if (isValidEmail && enteredCcIsNotSelectedOrMailboxEmail && autocompleteResultIsNotTheSameAsEnteredCc) {
      results.unshift(EmberObject.create({
        isNew: true,
        identity: {
          email: trimmedAddress
        }
      }));
    }

    return results;
  }).restartable(),

  caseIdChangeObserver: observer('case.id', function() {
    next(this, () => {
      this.send('onBack');
    });
  }),

  conversationIdObserver: observer('conversationId', async function() {
    if (this.get('conversationId')) {
      await this.loadConversation(this.get('conversationId'));
    }
  }),

  currentConversationObserver: observer('currentConversation.id', async function() {
    if (this.get('currentConversation.id')) {
      await this.loadConversation(this.get('currentConversation.id'));
    }
  }),

  resetData() {
    this.set('isNew', true);
    this.set('currentConversation', null);
    this.set('loadedConversation', null);
    this.set('toEmails', []);
    this.set('ccEmails', []);
    this.set('emailContent', '');
    this.set('subject', '');
    this.set('errors', {});
    this.set('attachments', []);
    this.set('isSending', false);
    this.set('uploadingFiles', false);
  },

  async loadConversation(conversationId, isReplying) {
    if (!conversationId) {
      this.resetData();
      return;
    }
    try {
      setTimeout(() => {
        this.get('setView')('INDIVIDUAL_CONVERSATION');
        this.set('isNew', false);
      });
      if (!isReplying) {
        this.set('loadedConversation', null);
        this.set('toEmails', []);
        this.set('ccEmails', []);
        this.set('subject', '');
        this.set('emailContent', '');
        this.set('attachments', []);
      }
      const sideConversationAdapter = this.get('store').adapterFor('side-conversation');
      const sideConversation = await sideConversationAdapter.loadSideConversation(conversationId, { limit: 100 });
      this.set('loadedConversation', sideConversation);
      
      const lastMessage = sideConversation[sideConversation.length - 1].message;
      const toEmails = lastMessage.recipients
        .filter(recipient => recipient.type === 'TO')
        .map(recipient => recipient.identity.email);
      const ccEmails = lastMessage.recipients
        .filter(recipient => recipient.type === 'CC')
        .map(recipient => recipient.identity.email);

      if (toEmails.length === 0) {
        const lastMessageCreatorEmail = sideConversation[sideConversation.length - 1].message.creator.emails[0].email;
        toEmails.push(lastMessageCreatorEmail);
      }

      setTimeout(() => {
        this.set('toEmails', toEmails);
        this.set('ccEmails', ccEmails);
      });
    } catch (error) {
      this.get('notification').error(this.get('i18n').t('generic.generic_error'));
    }
  },

  onUploadAttachments(files) {
    const combinedAttachments = [...(this.get('attachments') || [])];
    for (const file of files) {
      if (file.isUploading) {
        combinedAttachments.push(file);
      } else {
        const indexToUpdate = combinedAttachments.findIndex(f => f.name === file.name && f.size === file.size);
        if (indexToUpdate > -1) {
          combinedAttachments[indexToUpdate] = file;
        } else {
          combinedAttachments.push(file);
        }
      }
    }
    this.set('attachments', combinedAttachments);
  },

  actions: {
    async updateConversationStatus() {
      const newStatus = this.get('isConversationClosed') ? 'open' : 'closed';
      try {
        const sideConversationAdapter = this.get('store').adapterFor('side-conversation');
        await sideConversationAdapter.updateStatus(this.get('case.id'), this.get('currentConversation.id'), newStatus);
        
        await this.loadConversation(this.get('currentConversation.id'), true);
        this.sendAction('refetchConversations', true);
        this.set('currentConversation.status', newStatus);

        const successKey = newStatus === 'closed' ? 'closed_success' : 'reopened_success';
        this.get('notification').success(this.get('i18n').t(`cases.side_conversations.${successKey}`));
      } catch (error) {
        this.get('notification').error(this.get('i18n').t('cases.side_conversations.status_update_error'));
      }
    },

    cancelAttachment(attachment) {
      this.set('attachments', this.get('attachments').filter(a => a.name !== attachment.name || a.size !== attachment.size));
    },
    
    async send(e) {
      if (this.get('isSendDisabled')) {
        return;
      }
      this.set('isSending', true);
      this.set('isNew', false);
      this.get('setView')('INDIVIDUAL_CONVERSATION');

      const caseId = this.get('case.id');
      const subject = this.get('subject');
      const contents = this.get('emailContent');
      const toEmails = this.get('toEmails');
      const ccEmails = this.get('ccEmails');
      const attachmentFileIds = this.get('attachments').map(file => file.attachmentId).filter(Boolean);

      const channelOptions = {
        to: toEmails.join(',')
      };

      if (ccEmails.length > 0) {
        channelOptions.cc = ccEmails.join(',');
      }

      const sideConversationAdapter = this.get('store').adapterFor('side-conversation');

      this.send('updateEmailContent', '');
      this.set('attachments', []);

      try {
        let sideConversation;
        if (this.get('currentConversation.id')) {
          sideConversation = await sideConversationAdapter.replyToSideConversation(
            this.get('currentConversation.id'),
            contents,
            channelOptions,
            attachmentFileIds
          );
          await this.loadConversation(this.get('currentConversation.id'), true);
        } else {
          sideConversation = await sideConversationAdapter.createNewSideConversation(
            caseId,
            subject,
            contents,
            channelOptions,
            attachmentFileIds
          );
          this.set('currentConversation', sideConversation);
        }
        this.get('refetchConversations')(true);

      } catch (error) {
        this.get('notification').error(this.get('i18n').t('generic.generic_error'));
      } finally {
        this.set('isSending', false);
        this.set('ccEmails', []);
      }
    },

    updateSubject(subject) {
      this.set('subject', subject);
    },

    setToEmails(emailList) {
      const uniqueEmails = Array.from(new Set(emailList.map(email => {
        if (typeof email === 'string') {
          return email;
        } else {
          return email.get('identity.email');
        }
      })));
      this.set('toEmails', uniqueEmails);
    },

    setCCEmails(emailList) {
      const uniqueEmails = Array.from(new Set(emailList.map(email => {
        if (typeof email === 'string') {
          return email;
        } else {
          return email.get('identity.email');
        }
      })));
      this.set('ccEmails', uniqueEmails);
    },

    updateEmailContent(content) {
      this.set('emailContent', content);
    },

    setImageUploadStatus(status){
      this.set('isImageUploading', status);
    },

    onAttachFiles(files) {
      files.forEach(file => {
        this.get('uploadService').get('uploadFile').perform(file, null, null, 
          (file) => {
            this.set('uploadingFiles', true);
            this.onUploadAttachments([file]);
          },
          (file) => {
            this.set('uploadingFiles', false);
            this.onUploadAttachments([file]);
          }
        );
      });
    },

    async reloadConversation() {
      if (!this.get('loadedConversation')) {
        return;
      }
      this.set('loadedConversation', null);
      await this.loadConversation(this.get('currentConversation.id'));
      this.get('refetchConversations')(true);
    },

    onBack() {
      this.get('setView')('CONVERSATIONS_LIST');
      this.resetData();
    }
  }
});
