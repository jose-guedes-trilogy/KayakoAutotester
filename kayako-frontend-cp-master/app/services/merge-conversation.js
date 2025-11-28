import { Promise as EmberPromise } from 'rsvp';
import Service, { inject as service } from '@ember/service';

export default Service.extend({
  i18n: service(),
  activeMerge: null,
  confirmationPromise: null,

  /* Store functions to accept/reject current confirmation promise */
  _acceptMerge: null,
  _rejectMerge: null,

  confirm({
    intlMergeHeader = 'cases.merge_conversation.modal.header',
    intlMergeConfirmationHeader = 'cases.merge_conversation.modal.merge_confirmation_header',
    intlMergeLabel = 'cases.merge_conversation.modal.button',
    intlNextLabel = 'generic.next',
    intlSelectedLabel = 'generic.selected',
    intlBackLabel = 'generic.back',
    intlConversationsSelectedLabel = 'cases.merge_conversation.modal.conversations_selected',
    intlPrimaryConversationMessageBold = 'cases.merge_conversation.modal.primary_conversation_message_bold',
    intlPrimaryConversationMessageEnd = 'cases.merge_conversation.modal.primary_conversation_message_end',
    requesterName,
    currentCase,
    cases,
    skipSelection
  }) {
    let selectedCases = [];

    if (cases) {
      let [primary, ...auxiliary] = cases.sortBy('createdAt');
      currentCase = primary;
      selectedCases = auxiliary;
    }

    this.set('activeMerge', {
      header: intlMergeHeader ? this.get('i18n').t(intlMergeHeader) : null,
      mergeConfirmationHeader: this.get('i18n').t(intlMergeConfirmationHeader),
      mergeLabel: this.get('i18n').t(intlMergeLabel),
      nextLabel: this.get('i18n').t(intlNextLabel),
      selectedLabel: this.get('i18n').t(intlSelectedLabel),
      backLabel: this.get('i18n').t(intlBackLabel),
      conversationsSelectedLabel: this.get('i18n').t(intlConversationsSelectedLabel),
      primaryConversationMessageBold: this.get('i18n').t(intlPrimaryConversationMessageBold),
      primaryConversationMessageEnd: this.get('i18n').t(intlPrimaryConversationMessageEnd),
      requesterName: requesterName,
      currentCase,
      selectedCases,
      skipSelection
    });

    return new EmberPromise((accept, cancel) => {
      this.set('_acceptMerge', accept);
      this.set('_rejectMerge', cancel);
    }).finally(() => {
      this.set('activeMerge', null);
      this.set('_acceptMerge', null);
      this.set('_rejectMerge', null);
    });
  },

  cancelMerge(...args) {
    this.get('_rejectMerge')(...args);
  },

  acceptMerge(...args) {
    this.get('_acceptMerge')(...args);
  }
});
