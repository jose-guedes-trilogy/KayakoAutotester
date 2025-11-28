import Component from '@ember/component';
import { A } from '@ember/array';
import EmberObject from '@ember/object';

const createRecipient = () => {
  return EmberObject.create({
    fullname: '',
    email: '',
    teams: A([]),
    role: null,
    errors: null
  });
};

export default Component.extend({
  invitation: null,
  referenceData: {
    teams: [],
    roles: []
  },
  onRowsChanged: null,

  init() {
    this._super(...arguments);

    if (!this.get('invitation.users.length')) {
      this.get('invitation.users').pushObject(createRecipient());
    }
  },

  actions: {
    addRecipient() {
      this.get('invitation.users').pushObject(createRecipient());

      const onRowsChanged = this.get('onRowsChanged');
      if (typeof (onRowsChanged) === 'function') {
        onRowsChanged('added', this.get('invitation.users.length'));
      }
    },

    removeRecipient(recipient) {
      this.get('invitation.users').removeObject(recipient);

      const onRowsChanged = this.get('onRowsChanged');
      if (typeof (onRowsChanged) === 'function') {
        onRowsChanged('removed', this.get('invitation.users.length'));
      }
    }
  }
});
