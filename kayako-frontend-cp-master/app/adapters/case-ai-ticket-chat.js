import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  pathForType() {
    return 'ai-ticket-chat';
  },

  async addChatToCase(caseId, chat_message) {
    return this.ajax(`/api/v1/cases/${caseId}/ai-ticket-chat`, 'POST', {
    data: {
        'ai_ticket_chat_history': chat_message
      }
    });
  },
});
