import ApplicationAdapter from './application';
import UnpaginateMixin from './unpanginate-mixin';

export default ApplicationAdapter.extend(UnpaginateMixin, {
  makeDefault(mailbox) {
    let url = `${this.namespace}/mailboxes/default`;
    let options = { data: { mailbox_id: mailbox.get('id') } };

    return this.ajax(url, 'PUT', options);
  }
});
