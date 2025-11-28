import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { attr, model, isEdited } from 'frontend-cp/services/virtual-model';
import diffAttrs from 'ember-diff-attrs';

const schema = model('token', {
  id: attr(),
  label: attr(),
  description: attr(),
  isEnabled: attr(),
  createdAt: attr(),
  updatedAt: attr()
});
export default Component.extend({
  // Attributes
  webhook: null,
  registerAs: () => {},
  didSave: () => {},
  cancel: () => {},

  // Services
  virtualModel: service(),
  i18n: service(),
  notification: service(),
  confirmation: service(),

  // Lifecycle hooks
  init() {
    this._super(...arguments);
    this.get('registerAs')(this);
  },

  didReceiveAttrs: diffAttrs('webhook', function(changedAttrs, ...args) {
    this._super(...args);
    if (!changedAttrs || changedAttrs.webhook) {
      this.initEdits();
    }
  }),

  // CPs
  canBeDeleted: computed.not('webhook.isNew'),

  // Actions
  actions: {
    save() {
      let webhook = this.get('webhook');
      let editedWebhook = this.get('editedWebhook');

      return this.get('virtualModel').save(webhook, editedWebhook, schema)
        .then(() => {
          this.set('editedWebhook', this.get('virtualModel').makeSnapshot(this.get('webhook'), schema));
        })
        .then(this.get('didSave'));
    },

    deleteWebhook() {
      return this.get('confirmation').confirm({
        intlConfirmationBody: 'admin.apps.webhooks.labels.delete_confirmation',
        intlConfirmationHeader: 'admin.apps.webhooks.labels.confirm_delete',
        intlConfirmLabel: 'generic.confirm.delete_button'
      }).then(() => this.get('webhook').destroyRecord().then(() => this.attrs.didSave()));
    },

    onCopiedToClipboard() {
      const successText = this.get('i18n').t('generic.copied_to_clipboard');
      this.get('notification').success(successText);
    }
  },

  // Methods
  initEdits() {
    this.set('editedWebhook', this.get('virtualModel').makeSnapshot(this.get('webhook'), schema));
  },

  isEdited() {
    return isEdited(this.get('webhook'), this.get('editedWebhook'), schema);
  }
});
