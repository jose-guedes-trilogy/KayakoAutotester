import $ from 'jquery';
import UploadFile from 'frontend-cp/lib/upload-file';
import { task } from 'ember-concurrency';
import RSVP from 'rsvp';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import Service from '@ember/service';
import { run } from '@ember/runloop';

class FileUploadError extends Error {
  constructor() {
    super(...arguments);
    this.name = 'FileUploadError';
  }
}

export default Service.extend({
  i18n: service(),
  notificationService: service('notification'),
  sessionService: service('session'),

  headers: computed('sessionService.sessionId', function () {
    let { sessionId, csrfToken } = this.get('sessionService').getProperties('sessionId', 'csrfToken');

    let headers = {};

    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    if (sessionId) {
      headers['X-Session-ID'] = sessionId;
    }

    return headers;
  }),

  validateUploads(uploadFile, uploads, channel) {
    if (!this.isUploadValid(uploadFile, uploads, channel)) {
      this.get('notificationService').add({
        type: 'error',
        title: this.get('i18n').t('generic.uploads.failed'),
        autodismiss: true,
        dismissable: false
      });
    }
  },

  uploadFile: task(function * (file, uploads, channel, onUploadStart, onUploadEnd) {
    let formData = new FormData();
    let uploadFile = UploadFile.create({name: file.name, size: file.size});

    formData.append('name', file.name);
    formData.append('content', file);

    if (onUploadStart) { onUploadStart(uploadFile); }
    return yield new RSVP.Promise((resolve, reject) => {
      $.ajax({
        url: '/api/v1/core/file',
        type: 'POST',
        headers: this.get('headers'),
        //Ajax events
        success: response => {
          uploadFile.set('progress', 100);
          uploadFile.set('status', 'SUCCESS');
          uploadFile.set('contentUrl', response.data.content_url);
          uploadFile.set('contentType', response.data.content_type);
          uploadFile.set('size', response.data.size);
          uploadFile.set('attachmentId', response.data.id);

          this.validateUploads(uploadFile, uploads, channel);
          if (onUploadEnd) { onUploadEnd(uploadFile); }
          run(null, resolve, uploadFile);
        },
        error: response => {
          uploadFile.set('status', 'ERROR');

          if (response.status === 413) {
            uploadFile.set('error', 'TOO_LARGE');
          } else if (response.status === 402 && response.responseJSON.errors[0].code === 'LICENSE_LIMIT_REACHED') {
            uploadFile.set('error', 'TOO_LARGE');
          } else if (response.responseJSON && response.responseJSON.notifications) {
            uploadFile.set('error', response.responseJSON.notifications[0].message);
          } else {
            uploadFile.set('error', 'UNKNOWN');
          }

          this.validateUploads(uploadFile, uploads, channel);
          if (onUploadEnd) { onUploadEnd(uploadFile); }
          let error = new FileUploadError(uploadFile.get('error'));
          run(null, reject, error);
        },
        xhr: (XMLHttpRequest) => {
          let xhr = new window.XMLHttpRequest();

          //Upload progress
          xhr.upload.addEventListener('progress', (evt) => {
            uploadFile.set('status', 'PROGRESS');
            uploadFile.set('progress', (evt.loaded * 100) / evt.total);
          }, false);

          uploadFile.set('xhr', xhr);

          return xhr;
        },
        // Form data
        data: formData,
        //Options to tell jQuery not to process data or worry about content-type.
        cache: false,
        contentType: false,
        processData: false
      });
    });
  }),

  isUploadValid(upload, uploads, channel) {
    if (!channel) {
      return true;
    }

    switch (channel.get('channelType')) {
      case 'TWITTER': return this.validateTwitterUpload(upload, uploads);
      default: return true;
    }
  },

  validateTwitterUpload(upload, uploads) {
    // User may attach up to 4 photos less than 3MB each, 1 animated GIF less than 3MB or 1 MP4 less than 15MB
    const isImageType = ['image/jpeg', 'image/png', 'image/webp'];
    const isAnimatedType = ['image/gif'];
    const isVideoType = ['video/mp4', 'video/quicktime'];
    const allowedTypes = [].concat(isImageType).concat(isAnimatedType).concat(isVideoType);
    const size3MB = 3000000;
    const size15MB = 15000000;

    let images = 0;
    let videos = 0;
    let animated = 0;

    uploads.forEach((uploaded) => {
      if (isImageType.indexOf(uploaded.get('contentType')) > -1) {
        images++;
      } else if (isAnimatedType.indexOf(uploaded.get('contentType')) > -1) {
        animated++;
      } else if (isVideoType.indexOf(uploaded.get('contentType')) > -1) {
        videos++;
      }
    });

    let allowedCountsFailed = false;

    if (images > 4 || animated > 1 || videos > 1) {
      allowedCountsFailed = true;
    } else if (images > 0 && animated > 0) {
      allowedCountsFailed = true;
    } else if (images > 0 && videos > 0) {
      allowedCountsFailed = true;
    } else if (animated > 0 && videos > 0) {
      allowedCountsFailed = true;
    }

    if (allowedCountsFailed) {
      upload.setProperties({ status: 'ERROR', error: 'TWITTER_VALIDATION_FAILED' });
      return false;
    }

    if (allowedTypes.indexOf(upload.get('contentType')) === -1) {
      upload.setProperties({ status: 'ERROR', error: 'TWITTER_VALIDATION_FAILED' });
      return false;
    }

    // image size should be less than 3MB
    if (isImageType.indexOf(upload.get('contentType')) > -1 && upload.get('size') > size3MB) {
      upload.setProperties({ status: 'ERROR', error: 'TOO_LARGE' });
      return false;
    }

    // animated gif size should be less than 3MB
    if (isAnimatedType.indexOf(upload.get('contentType')) > -1 && upload.get('size') > size3MB) {
      upload.setProperties({ status: 'ERROR', error: 'TOO_LARGE' });
      return false;
    }

    // video MP4 size should be less than 15MB
    if (isVideoType.indexOf(upload.get('contentType')) > -1 && upload.get('size') > size15MB) {
      upload.setProperties({ status: 'ERROR', error: 'TOO_LARGE' });
      return false;
    }

    return true;
  }
});
