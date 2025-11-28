import { computed } from '@ember/object';
import Controller from '@ember/controller';
import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';

export default Controller.extend({
  session: service(),
  i18n: service(),
  confirmation: service(),

  cookiePrivacyLinks: computed('model.[]', function () {
    return this.get('model').filter((privacy) => {
      return privacy.get('privacyType') === 'COOKIE';
    });
  }),

  registerPrivacyLinks: computed('model.[]', function () {
    return this.get('model').filter((privacy) => {
      return privacy.get('privacyType') === 'REGISTRATION';
    });
  }),

  actions: {
    makeDefault(caseprivacy, e) {
      e.stopPropagation();
      const adapter = getOwner(this).lookup('adapter:application');
      const url = `${adapter.namespace}/cases/privacies/default`;

      this.store.peekAll('case-privacy').forEach(caseprivacy => {
        caseprivacy.set('isDefault', false);
      });
      caseprivacy.set('isDefault', true);
      //TODO: this model is left dirty - it is not an issue,
      //but ideally we would mark this as clean.

      const options = {
        data: {privacy_id: caseprivacy.get('id')}
      };

      adapter.ajax(url, 'PUT', options);
    },

    toggleEnabledStatus(caseprivacy, e) {
      e.stopPropagation();
      caseprivacy.toggleProperty('isEnabled');
      caseprivacy.save();
    },

    transitionToNewPrivacyPolicyLinkRoute() {
      this.transitionToRoute('session.admin.customizations.privacy.new');
    },

    editPrivacy(privacy) {
      this.transitionToRoute('session.admin.customizations.privacy.edit', privacy.get('id'));
    },

    showDeleteConfirmation(privacy, e) {
      e.stopPropagation();

      this.get('confirmation').confirm({
        intlConfirmLabel: 'generic.confirm.delete_button',
        intlConfirmationBody: 'admin.privacies.confirm_delete.body',
        intlConfirmationHeader: 'admin.privacies.confirm_delete.title'
      }).then(() => {
        this.send('deleteField', privacy);
      });

    },
    deleteField(privacy) {
      privacy.destroyRecord();
    }
  }
});
