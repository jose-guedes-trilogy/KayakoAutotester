import { or , filterBy } from '@ember/object/computed';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

import { task } from 'ember-concurrency';

export default Component.extend({
  // Attributes
  privacy: null,
  editedPrivacy: null,
  title: null,
  locales: null,
  onSave: () => {},
  onCancel: () => {},
  onDelete: () => {},

  init() {
    this._super(...arguments);
    // Getting all locales
    this.set('locales', this.get('store').findAll('locale', {reload: true}));
  },

  enabledLocales: filterBy('locales', 'isPublic', true),

  locale: computed('editedPrivacy.locale', 'enabledLocales',function() {
    const localeIdentificator = this.get('editedPrivacy.locale');
    return this.get('enabledLocales').find((obj) => obj.get('locale') === localeIdentificator);
  }),

  // Services
  confirmation: service(),
  virtualModel: service(),
  store: service(),

  privacyTypes: computed(function() {
    return [
      {
        titleKey: 'admin.privacy.privacy_types.register',
        id: 'REGISTRATION',
      },
      {
        titleKey: 'admin.privacy.privacy_types.cookie',
        id: 'COOKIE',
      },
    ];
  }),

  privacyType: computed('editedPrivacy.privacyType', 'privacyTypes', function () {
    const privacyTypeId = this.get('editedPrivacy.privacyType');
    return this.get('privacyTypes').find(({ id }) => id === privacyTypeId);
  }),

  isDisabled: or('save.isRunning', 'performDelete.isRunning'),

  confirmDelete: task(function * () {
    yield this.get('confirmation').confirm({
      intlConfirmationBody: 'admin.privacy.confirm_delete.body',
      intlConfirmationHeader: 'admin.privacy.confirm_delete.title',
      intlConfirmLabel: 'generic.confirm.delete_button'
    });
    yield this.get('performDelete').perform();
    this.get('onDelete')();
  }),

  performDelete: task(function * () {
    yield this.get('privacy').destroyRecord();
  }),

  save: task(function * () {
    const privacy = this.get('privacy');
    const editedPrivacy = this.get('editedPrivacy');
    const schema = this.get('schema');

    yield this.get('virtualModel').save(privacy, editedPrivacy, schema);
    this.get('onSave')();
  })
});
