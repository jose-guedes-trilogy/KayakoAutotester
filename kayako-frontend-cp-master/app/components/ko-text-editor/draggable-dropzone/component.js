import Component from '@ember/component';
import { bool } from '@ember/object/computed';

export default Component.extend({
  tagName: '',

  // Attributes
  onDrop: null,
  isUploadEnabled: bool('onDrop'),
  onUploadImages: null,
  dropzoneError: null,

  // State
  active: false,
  dragCounter: 0,

  handleDrop(event) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (this.get('isUploadEnabled') && files.length) {
      const fileType = files[0].type;

      if (fileType.startsWith('image/') && this.get('isRichFormattingAvailable')) {
        this.get('onUploadImages')(files);
      } else {
        this.get('onDrop')(Array.slice((event.dataTransfer || event.originalEvent.dataTransfer).files));
      }
    }
    this.set('dragCounter', 0);
    this.set('active', false);
  },

  actions: {
    dragEnter(event) {
      event.preventDefault();
      this.incrementProperty('dragCounter');
      this.set('active', true);
    },

    dragOver(event) {
      event.preventDefault();
    },

    dragLeave(event) {
      event.preventDefault();
      this.decrementProperty('dragCounter');
      if (this.get('dragCounter') === 0) {
        this.set('active', false);
      }
    },

    // This event is prevented by Froala, thats why we have to rethrow it
    // and handle Froala events, instead of native
    dropOnEditor(froalaEvent, editor, event) {
      this.handleDrop(event);
    },

    drop(event) {
      this.handleDrop(event);
    },

    swallowEditorEvent(froalaEvent, editor, event) {
      event.preventDefault();
    }
  }
});
