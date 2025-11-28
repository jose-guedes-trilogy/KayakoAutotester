import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  pathForType() {
    return 'ai-summary';
  },

  async generateSummary(caseId) {
    const summary = await this.ajax(`/api/v1/cases/${caseId}/ai-summary`, 'GET');
    return summary.data.ai_summary;
  },

  async addSummaryToCase(caseId, summary) {
    return this.ajax(`/api/v1/cases/${caseId}/ai-summary`, 'POST', {
      data: {
        'ai_summary': summary
      }
    });
  },
});
