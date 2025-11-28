import EmberObject from '@ember/object';

export default EmberObject.extend({
  progress: 0,
  name: null,
  attachmentId: null,
  contentUrl: null,
  contentType: null,
  size: null,
  failed: false,
  error: '',
  xhr: null,
  status: 'PROGRESS',

  cancel() {
    if (this.get('xhr') && this.get('xhr').abort) {
      this.get('xhr').abort();
    }
    this.set('status', 'CANCELLED');
    this.set('attachmentId', null);
  }
});
