import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { inject as service } from '@ember/service';
import styles from './styles';
import $ from 'jquery';

export default Component.extend({
  tagName: '',
  store: service(),
  timeline: service(),
  metrics: service(),

  attachment: null,
  thumbnailSize: 200,

  isTranscriptable: computed('attachment.{name,size}', function() {
    const name = this.get('attachment.name') || '';
    const size = this.get('attachment.size') || 0;
    const allowedExtensions = ['mp3', 'mpeg', 'wav', 'mp4'];
    const maxSize = 20 * 1024 * 1024; // 20 MB in bytes

    // Extract the file extension
    const fileExtension = name.split('.').pop().toLowerCase();

    // Check if the file extension is allowed and the size is within the limit
    if (allowedExtensions.includes(fileExtension) && size < maxSize) {
        return true;
    } else {
        return false;
    }
  }),

  thumbnail: computed('attachment.thumbnails.[]', function() {
    const size = this.get('thumbnailSize');
    const filtered = this.get('attachment.thumbnails').filter(thumbnail => {
      const width = typeof thumbnail.get === 'function' ? thumbnail.get('width') : get(thumbnail, 'width');
      return width <= size;
    });
    return filtered.get('lastObject');
  }),

  icon: computed('attachment.name', 'attachment.attachmentType', function() {
    let name = this.get('attachment.name') || '';
    let ext = name.slice(name.lastIndexOf('.') + 1, name.length).toUpperCase();

    let mimeType = this.get('attachment.attachmentType') || '';
    let type = mimeType.slice(0, mimeType.indexOf('/')).toUpperCase();
    let subtype = mimeType.slice(mimeType.lastIndexOf('/') + 1, mimeType.length).toUpperCase();

    let icon = 'attachment/icon--file_';

    let static_icon_ext = ['AI', 'CSS', 'DOC', 'HTML', 'PDF', 'PPT', 'PSD', 'SK', 'TXT', 'XD', 'XLS', 'ZIP'];
    if (static_icon_ext.includes(ext)) {
      return icon + ext;
    }

    switch (type) {
      case 'AUDIO': return icon + 'Audio';
      case 'IMAGE': return icon + 'Image';
      case 'VIDEO': return icon + 'Video';
      case 'TEXT': return icon + 'TXT';
    }

    if (subtype) {
      if (subtype.includes('spreadsheet')) { return icon + 'XLS'; }
      if (subtype.includes('presentation')) { return icon + 'PPT'; }
      if (subtype.includes('image')) { return icon + 'Image'; }
      if (subtype.includes('graphics')) { return icon + 'Image'; }
      if (subtype.includes('document')) { return icon + 'DOC'; }
      if (subtype.includes('compressed')) { return icon + 'ZIP'; }
    }

    return icon + 'Generic';
  }),

  actions: {
    triggerPreview(event) {
      event.preventDefault();
      event.stopPropagation();
      $(event.currentTarget).parents(`.${styles.attachment}`).find(`.${styles.thumbnail} > div`).click();
    },

    async triggerTranscribe(event) {
      event.preventDefault();
      event.stopPropagation();

      if (!this.get('isTranscriptable')) {
        this.set('error', 'The file type is not supported for transcription.');
        return;
      }

      const store = this.get('store');
      const caseTranscriptionAdapter = store.adapterFor('case-ai-transcription');
      this.set('isTranscribing', true);
      try {
        this.get('metrics').trackEvent({
          event: 'AI Transcription Added to Case',
          caseId: this.get('case').id,
        });
        const attachmentId = this.get('attachment.id');
        const attachmentName = this.get('attachment.name');
        const caseId = this.get('case').id;
       
        const transcription = await caseTranscriptionAdapter.transcribeAudio(caseId, attachmentId, attachmentName);
        this.set('transcriptionResult', transcription);
        /* this.get('fetchNewerPosts').perform();*/
      } catch (error) {
        this.get('notificationService').error(this.get('i18n').t('generic.generic_error'));
      } finally {
        this.set('isTranscribing', false);
        
      }
    }
  },

});
