import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: '',

  // Attributes
  identity: null,
  index: null,
  type: null,
  onRemove: () => {},
  onMakePrimary: () => {},
  onValidate: () => {},
  onCopyToClipboard: () => {},
  onMarkEmailAsValidated: () => {},

  // Services
  i18n: service(),

  // CPs
  options: computed('type', 'identity.canBeRemoved', 'identity.canBePrimarized', 'identity.canBeValidated', function () {
    const i18n = this.get('i18n');
    let options = [];
    options.push({
      label: i18n.t('generic.identities.copy_identity'), id: 'copy'
    });
    if (this.get('identity.canBeRemoved')) {
      options.push({
        label: i18n.t('generic.identities.remove_identity'), id: 'remove'
      });
    }
    if (this.get('identity.canBePrimarized')) {
      options.push({
        label: i18n.t('generic.identities.make_primary'), id: 'make_primary'
      });
    }
    if (this.get('identity.canBeValidated')) {
      options.push({
        label: i18n.t('generic.identities.validate_identity'), id: 'validate'
      }, {
        label: i18n.t('generic.identities.mark_email_as_validated.text'), id: 'mark_email_as_validated'
      });
    }
    if (this.get('type') === 'twitter') {
      options.push({
        label: i18n.t('generic.identities.see_profile'), id: 'open_profile'
      });
    }
    return options;
  }),

  actions: {
    selectItem(item) {
      const identity = this.get('identity');
      switch (item.id) {
        case 'remove':
          this.get('onRemove')(identity);
          break;

        case 'make_primary':
          this.get('onMakePrimary')(identity);
          break;

        case 'validate':
          this.get('onValidate')(identity);
          break;

        case 'mark_email_as_validated':
          this.get('onMarkEmailAsValidated')(identity);
          break;

        case 'copy':
          this.get('onCopyToClipboard')();
          break;
      }
    }
  }
});
