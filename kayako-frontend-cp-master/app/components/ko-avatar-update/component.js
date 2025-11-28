import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';

export default Component.extend({
  tagName: '',

  // Services
  i18n: service(),
  store: service(),
  notification: service(),
  confirmation: service(),
  errorHandler: service(),

  // Attributes
  user: null,
  dropdown: null,

  isLoading: computed('handleAvatarDeletion.isRunning', 'updateAvatar.isRunning', function () {
    return this.get('handleAvatarDeletion.isRunning') || this.get('updateAvatar.isRunning');
  }),

  options: computed(function () {
    const i18n = this.get('i18n');

    this.get('fetchAvatar').perform();

    return [
      { label: i18n.t('users.upload_photo'), id: 'upload' },
      { label: i18n.t('users.remove_photo'), id: 'remove' }
    ];
  }),

  // Tasks
  removeAvatar: task(function * (userid) {
    return yield this.get('store').adapterFor('user').deleteAvatar(userid);
  }).restartable(),

  updateAvatar: task(function * (userid, image) {
    const removeOption = { label: this.get('i18n').t('users.remove_photo'), id: 'remove' };

    let data = yield this.get('store').adapterFor('user').updateAvatar(userid, image);

    this.set('user.avatar', data.data.url);
    this.get('user').save();

    if (this.get('options').filterBy('id', 'remove').length === 0) {
      this.get('options').pushObject(removeOption);
    }
  }).restartable(),

  fetchAvatar: task(function * () {
    const userid = this.get('user.id');
    return yield this.get('errorHandler').disableWhile(() => {
      return this.get('store').adapterFor('user').fetchAvatar(userid)
        .catch(err => { this.get('options').popObject(); });
    });
  }).restartable(),

  handleAvatarDeletion: task(function * (userid) {
    const i18n = this.get('i18n');

    yield this.get('confirmation').confirm({
      intlConfirmationHeader: 'users.confirm.delete_avatar.header',
      intlConfirmationBody: 'users.confirm.delete_avatar.body',
      intlConfirmLabel: 'users.confirm.delete_avatar.confirm'
    });

    try {
      yield this.get('removeAvatar').perform(userid);
      this.get('notification').success(i18n.t('users.avatar_removal_success'));
      this.set('user.avatar', null);
      this.get('user').save();
      this.get('options').popObject();
    }
    catch (err) {
      this.get('notification').error(i18n.t('users.avatar_removal_failure'));
    }
  }).drop(),

  // Actions
  actions: {
    selectItem(option, dropdown) {
      const userid = this.get('user.id');
      switch (option.id) {
        case 'upload':
          this.set('dropdown', dropdown);
          break;
        case 'remove':
          dropdown.actions.close();
          this.get('handleAvatarDeletion').perform(userid);
          break;
      }
    },

    onAttachFiles(avatar) {
      const userid = this.get('user.id');

      const image = avatar[0];
      if (image.type.includes('image')) {
        let reader = new FileReader();

        let imageData = {
          data: null,
          type: image.type
        };

        let that = this;
        reader.onload = function () {
          imageData.data = this.result;

          let index = imageData.data.indexOf(',');
          imageData.data = imageData.data.slice(index + 1);

          index = imageData.type.indexOf('/');
          imageData.type = imageData.type.slice(index + 1);

          that.get('updateAvatar').perform(userid, imageData);
        };

        reader.readAsDataURL(image);
      }
      else {
        this.get('notification').error(this.get('i18n').formatHtmlMessage('users.incorrect_file_type', {filename: image.name}));
      }

      this.get('dropdown').actions.close();
    }
  }
});
