import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: '',

  // Attributes
  disabled: false,
  onAddEmail: () => {},
  onAddPhone: () => {},
  onAddTwitter: () => {},
  qaClass: null,

  // Services
  i18n: service(),

  // CPs
  options: computed(function () {
    const i18n = this.get('i18n');
    return [
      { label: i18n.t('generic.identities.add_email_identity'), id: 'add_email' },
      { label: i18n.t('generic.identities.add_phone_identity'), id: 'add_phone' },
      { label: i18n.t('generic.identities.add_twitter_identity'), id: 'add_twitter' }
    ];
  }),

  actions: {
    selectItem(item) {
      switch (item.id) {
        case 'add_email':
          this.get('onAddEmail')();
          break;

        case 'add_phone':
          this.get('onAddPhone')();
          break;

        case 'add_twitter':
          this.get('onAddTwitter')();
          break;
      }
    }
  }
});
