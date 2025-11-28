import Component from '@ember/component';
import { computed } from '@ember/object';
import { equal } from '@ember/object/computed';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: '',

  i18n: service(),
  plan: service(),

  // Attributes
  upload: null,
  onCancel: () => {},

  // CPs
  inProgress: equal('upload.status', 'PROGRESS'),
  success: equal('upload.status', 'SUCCESS'),
  error: equal('upload.status', 'ERROR'),

  uploadProgress: computed('upload.progress', function() {
    return Math.round(this.get('upload.progress'));
  }),

  errorText: computed('upload.error', function() {
    const error = this.get('upload.error');
    const i18n = this.get('i18n');

    if (error === 'TOO_LARGE') {
      const uploadLimit = this.get('plan.limits.attachment_size_limit');
      return i18n.t('generic.uploads.toolarge', { filesizeLimit: uploadLimit });
    } else if (error === 'TWITTER_VALIDATION_FAILED') {
      return i18n.t('generic.uploads.twitter_validation_failed');
    } else if (error === 'UNKNOWN') {
      return i18n.t('generic.uploads.unknown');
    } else {
      return error;
    }
  }),

  actions: {
    cancel() {
      this.get('upload').cancel();
      this.get('onCancel')(this.get('upload'));
    }
  }
});
