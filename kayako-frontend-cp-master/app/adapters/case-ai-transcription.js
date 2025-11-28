import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  pathForType() {
    return 'ai-transcription';
  },

  async transcribeAudio(caseId, attachment='') {
    // const transcription = await this.ajax(`/api/v1/transcription`, 'GET');
    // return transcription.data.text;
    return this.ajax(`/api/v1/cases/${caseId}/ai-transcription/`, 'POST', {
      data: {
        'ai_transcription': {attachmentId:parseInt(attachment, 10)}
      }
    });
  },
  async summarizeTranscription(caseId, attachment='') {
    // const transcription = await this.ajax(`/api/v1/transcription`, 'GET');
    // return transcription.data.text;
    return this.ajax(`/api/v1/cases/${caseId}/ai-transcription/`, 'POST', {
      data: {
        'ai_transcription': {transcribedText:attachment}
      }
    });
  },
});
