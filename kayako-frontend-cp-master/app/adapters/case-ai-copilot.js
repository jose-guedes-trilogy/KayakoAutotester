import ApplicationAdapter from './application';
import htmlToText from 'npm:html-to-text';

export default ApplicationAdapter.extend({
  pathForType() {
    return 'ai-copilot';
  },

  async generateSuggestion(caseId, text, context) {
    const response = await this.ajax(`/api/v1/cases/${caseId}/ai-copilot`, 'POST', {
      data: { text, context }
    });

    let suggestion = response.data.ai_copilot;
    if (suggestion) {
      // Strip all HTML from the suggestion
      suggestion = htmlToText.fromString(suggestion, {
        wordwrap: false,
        ignoreHref: true,
        ignoreImage: true,
        preserveNewlines: true
      });
    }

    return suggestion;
  },

});
