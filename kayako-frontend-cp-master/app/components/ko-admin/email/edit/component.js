import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads, filterBy } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import { getOwner } from '@ember/application';

export default Component.extend({
  // Attributes
  schema: null,
  mailbox: null,
  editedMailbox: null,
  brands: [],
  onCancel: null,
  onEdit: null,
  onSuccess: null,
  onError: null,

  // Services
  store: service(),
  virtualModel: service(),

  // CPs
  domain: computed(function () {
    return window.location.hostname;
  }),

  showDNS: reads('mailbox.isCustomDomain'),

  didReceiveAttrs() {
    this._super(...arguments);
    if (this.get('showDNS') && !this.get('mailbox.isNew')) {
      this.get('fetchConfiguration').perform();
    }
  },

  dnsConfiguration: reads('fetchConfiguration.last.value'),
  dnsError: reads('fetchConfiguration.last.error'),

  enabledBrands: filterBy('brands', 'isEnabled'),

  fetchConfiguration: task(function * () {
    const adapter = getOwner(this).lookup('adapter:application');
    const result = yield adapter.ajax(`${adapter.namespace}/mailboxes/${this.get('mailbox.id')}/configuration`);
    return result.data;
  }).drop(),

  actions: {
    save() {
      const virtualModel = this.get('virtualModel');
      const schema = this.get('schema');
      const mailbox = this.get('mailbox');
      const editedMailbox = this.get('editedMailbox');

      return virtualModel.save(mailbox, editedMailbox, schema).then(this.attrs.onEdit);
    }
  }
});
