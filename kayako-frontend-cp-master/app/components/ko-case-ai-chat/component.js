import Component from '@ember/component';
import { set, computed } from '@ember/object';
import { observer } from '@ember/object';
import { scheduleOnce } from '@ember/runloop';
import { isPresent } from '@ember/utils';
import { Promise } from 'rsvp';
import { inject as service } from '@ember/service';

const AI_CHAT_STORAGE_PREFIX = 'ai_chat_';

export default Component.extend({
  store: service(),
  metrics: service(),
  notificationService: service('notification'),
  window: service(),

  // Properties
  isChatWithTicketPopupVisible: false,
  messages: null,
  displayMessages: null,
  userInput: '',

  init() {
    this._super(...arguments);
    this._loadChatState();
  },

  didUpdateAttrs() {
    this._super(...arguments);
    if (this.isChatWithTicketPopupVisible) {
      this._loadChatState();
    }
    this._resetUserInput();
  },

  // Chat storage and persistence methods
  _getChatStorageKey(caseId) {
    return `${AI_CHAT_STORAGE_PREFIX}${caseId}`;
  },

  _fetchChatState(caseId) {
    const storageKey = this._getChatStorageKey(caseId);
    const savedData = JSON.parse(localStorage.getItem(storageKey));
    return { storageKey, savedData };
  },

  _loadChatState() {
    const caseId = this.get('case.id');    
    const { storageKey, savedData } = this._fetchChatState(caseId);
    let savedMessages = [];
    
    if (isPresent(savedData)) {
      const now = new Date().getTime();
      if (now < savedData.expiresAt) {
        savedMessages = savedData.messages;
      } else {
        localStorage.removeItem(storageKey);
      }
    }
    
    set(this, 'messages', savedMessages);
    set(this, 'displayMessages', savedMessages);
  },

  _persistChatState(caseId, message) {
    const { storageKey, savedData } = this._fetchChatState(caseId);
    let messages = [];
    
    if (savedData && savedData.messages) {
      messages = savedData.messages;
      if (messages.length > 0 && messages[messages.length - 1].isLoading) {
        messages.pop();
      }
    }
    
    messages.push(message);
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    const dataToSave = {
      messages: messages,
      expiresAt: new Date().getTime() + threeDaysInMs
    };
    
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  },

  _clearExpiredChats() {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith(AI_CHAT_STORAGE_PREFIX)) {
        try {
          const savedData = JSON.parse(localStorage.getItem(key));
          if (savedData) {
            const now = new Date().getTime();
            if (now >= savedData.expiresAt) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          localStorage.removeItem(key);
        }
      }
    }
  },

  // Chat UI and interaction methods
  _scrollToBottom(forceScroll = false) {
    const chatOutput = document.getElementById('chatOutputPopup');
    if (chatOutput) {
      const isAtBottom = chatOutput.scrollHeight - chatOutput.scrollTop - chatOutput.clientHeight < 50;
      if (forceScroll || isAtBottom) {
        chatOutput.scrollTop = chatOutput.scrollHeight;
      }
    }
  },

  async _streamResponse(caseId, content) {
    let currentIndex = 0;
    const messageIndex = this.displayMessages.length - 1;
    
    while (currentIndex < content.length) {
      // Stop streaming if the chat is not visible or the window is not visible
      if (!this.isChatWithTicketPopupVisible || this.get('case.id') !== caseId || !this.get('window.visible')) {
        this._loadChatState();
        return;
      }
      await new Promise((r) => setTimeout(r, 50));

      this.set(`displayMessages.${messageIndex}.content`, content.slice(0, currentIndex + 1));
      currentIndex++;
      this._scrollToBottom();
    }
    this.set(`displayMessages.${messageIndex}.isStreaming`, false);
  },

  _resetChat() {
    set(this, 'messages', []);
    set(this, 'displayMessages', []);
  },

  _resetUserInput() {
    this.set('userInput', '');
    const textarea = document.getElementById('chatInputPopup');
    if (textarea) {
      textarea.style.height = '35px';
    }
  },

  // API interaction methods
  async _fetchAIResponse(caseId) {
    const { savedData: savedData } = this._fetchChatState(caseId);
    const messages = savedData ? savedData.messages.slice(0, -1) : [];
    const chatHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    const adapter = this.get('store').adapterFor('case-ai-ticket-chat');
    const response = await adapter.addChatToCase(caseId, chatHistory);
    return {content: response.data.ai_ticket_chat_response};
  },

  // Computed properties
  isLoading: computed('displayMessages.@each.isLoading', function() {
    return this.displayMessages && this.displayMessages.findBy('isLoading', true);
  }),
  
  isStreaming: computed('displayMessages.@each.isStreaming', function() {
    return this.displayMessages && this.displayMessages.findBy('isStreaming', true);
  }),

  // Event observers
  messagesObserver: observer('displayMessages.[]', function() {
    scheduleOnce('afterRender', this, this._scrollToBottom, true);
  }),

  // Actions
  actions: {
    toggleChat() {
      this.get('metrics').trackEvent({
        event: 'AI Ticket Chat Opened',
        caseId: this.get('case.id')
      });
      const willOpen = !this.isChatWithTicketPopupVisible;
      if (willOpen) {
        this._clearExpiredChats();
        this._loadChatState();
      } else {
        this._resetChat();
      }
      set(this, 'isChatWithTicketPopupVisible', willOpen);
    },

    async sendMessage() {
      this.get('metrics').trackEvent({
        event: 'AI Ticket Chat Message Sent',
        caseId: this.get('case.id')
      });
      const message = this.userInput;
      const caseId = this.get('case.id');
      if (!message) return;

      let messageContent;
      try {
        const userMessage = { role: 'user', content: message };
        this._persistChatState(caseId, userMessage);
        this.displayMessages.pushObject(userMessage);
        
        this._resetUserInput();
        
        const loadingMessage = { role: 'assistant', content: '', isLoading: true };
        this._persistChatState(caseId, loadingMessage);
        this.displayMessages.pushObject(loadingMessage);

        const response = await this._fetchAIResponse(caseId);
        messageContent = response.content;
      } catch (error) {
        messageContent = 'Sorry, there was an error processing your request.';
        this.get('notificationService').error(this.get('i18n').t('generic.generic_error'));
      } finally {
        const assistantMessage = { 
          role: 'assistant', 
          content: messageContent, 
          isLoading: false
        };
        this._persistChatState(caseId, assistantMessage);

        this.displayMessages.removeObject(this.displayMessages.findBy('isLoading', true));
        const displayMessage = { role: 'assistant', content: '', isLoading: false, isStreaming: true };
        this.displayMessages.pushObject(displayMessage);

        await this._streamResponse(caseId, messageContent);
      }
    },

    closeChat() {
      this.get('metrics').trackEvent({
        event: 'AI Ticket Chat Closed',
        caseId: this.get('case.id')
      });
      this._resetChat();
      set(this, 'isChatWithTicketPopupVisible', false);
    },

    clearChat() {
      this.get('metrics').trackEvent({
        event: 'AI Ticket Chat Cleared',
        caseId: this.get('case.id')
      });
      const caseId = this.get('case.id');
      const storageKey = this._getChatStorageKey(caseId);
      this._resetChat();
      localStorage.removeItem(storageKey);
    },

    handleInputResize(event) {
      this.set('userInput', event.target.value);
      
      const textarea = event.target;
      textarea.style.height = 'auto';
      const maxHeight = 100;
      
      if (textarea.scrollHeight > maxHeight) {
        textarea.style.height = `${maxHeight}px`;
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.height = `${textarea.scrollHeight}px`;
        textarea.style.overflowY = 'hidden';
      }
    }
  }
});
