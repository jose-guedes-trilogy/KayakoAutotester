import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { set } from '@ember/object';

export default Component.extend({
  uploadedFiles: [],
  onUploadAttachments: () => {},
  disabled: false,
  uploading: false,

  uploadService: service('fileUpload'),

  handleAttachments(files) {
    files.forEach(file => {
      this.get('uploadService').get('uploadFile').perform(file, null, null, 
        (file) => {
          set(file, 'isUploading', true);
          this.onUploadAttachments([file]);
        },
        (file) => {
          set(file, 'isUploading', false);
          this.onUploadAttachments([file]);
        }
      );
    });
  },

  actions: {
    handleFileInput(event) {
      const files = Array.from(event.target.files || []);
      this.handleAttachments(files);
    },

    onDrop(files) {
      this.handleAttachments(files);
    },

    removeFile(file) {
      const index = this.uploadedFiles.findIndex(f => f.name === file.name && f.size === file.size);
      if (index > -1) {
        const newUploadedFiles = [...this.uploadedFiles];
        newUploadedFiles.splice(index, 1);
        this.onUploadAttachments(newUploadedFiles, true);
      }
    }
  }
});
