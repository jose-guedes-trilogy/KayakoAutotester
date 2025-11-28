//AI-GEN START GPT-4o
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { guidFor } from '@ember/object/internals';

const initialTextLength = 250;

export default Component.extend({

  metrics: service(),
  store: service(),
  tagName: '',
  // Attributes
  text: '',
  htmlContent: null,
  isExpanded: false,
  uniqueId: null,
  contextTitle: '',
  
  setReplyContent: null,
  openReply: null,
  submitReply: null,

  // Lifecycle Hooks
  init() {
    this._super(...arguments);
    this.uniqueId = guidFor(this);
    if (!this.htmlContent) {
      this.set('htmlContent', this.text);
    }
  },

  didInsertElement() {
    this._super(...arguments);
    const parent = this.get('parent');
    const event = this.get('event');
    this.get('metrics').trackEvent({
      event: 'Atlas AI - Viewed AI Generated Response',
      caseId: (parent && parent.id) || null,
      casePostUUID: (event && event.get('uuid')) || null
    });
  },


  truncatedText: computed('text', 'isExpanded', function() {
    const text = this.get('text');
    if (this.isExpanded) {
      return text;
    } else {
      if (text.length > initialTextLength) {
        return text.slice(0, text.slice(0, initialTextLength).lastIndexOf(' ')) + '...';
      } else {
        return text;
      }
    }
  }),

  showReadMoreButton: computed('text', function() {
    return (this.get('text')).length > initialTextLength;
  }),

  actions: {
    toggleExpand() {
      this.toggleProperty('isExpanded');
    },
    pasteAsIs() {
      const parent = this.get('parent');
      const event = this.get('event');
      this.get('metrics').trackEvent({
        event: 'Atlas AI - Paste as is',
        caseId: (parent && parent.id) || null,
        casePostUUID: (event && event.get('uuid')) || null
      });
      this.setReplyContent(`${this.htmlContent}`);
      this.openReply();
      this.submitReply();
    },
    editResponse() {
      const parent = this.get('parent');
      const event = this.get('event');
      this.get('metrics').trackEvent({
        event: 'Atlas AI - Edit Response',
        caseId: (parent && parent.id) || null,
        casePostUUID: (event && event.get('uuid')) || null
      });
      this.setReplyContent(`${this.htmlContent}`);
    },
    async summarizeTranscription() {
      this.set('isSummarizingTranscription', true);
      const store = this.get('store');
      const caseId = this.get('parent').id;
      const caseTranscriptionAdapter = store.adapterFor('case-ai-transcription');
      try{
        const transcription = await caseTranscriptionAdapter.summarizeTranscription(caseId, this.htmlContent);
        this.set('summarizedTrancription', transcription);
        this.get('metrics').trackEvent({
          event: 'AI Transcription Summary Added to Case',
          caseId: caseId,
        });
        /*this.get('fetchNewerPosts').perform();*/
      } catch (error) {
        this.get('notificationService').error(this.get('i18n').t('generic.generic_error'));
      } finally {
        this.set('isSummarizingTranscription', false);
      }
    }
  }
});
//AI-GEN END
