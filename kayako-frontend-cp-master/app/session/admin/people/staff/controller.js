import { inject as service } from '@ember/service';
import { oneWay } from '@ember/object/computed';
import Controller from '@ember/controller';
import { computed } from '@ember/object';

export default Controller.extend({
  permissions: service(),

  staff: oneWay('model'),

  enabledUsers: computed('filteredStaff.[]', function() {
    return this.get('filteredStaff').filterBy('isEnabled');
  }),

  disabledUsers: computed('filteredStaff.[]', function() {
    return this.get('filteredStaff').filterBy('isEnabled', false);
  }),

  filter: '',
  filteredStaff: computed('staff.[]', 'filter', function() {
    const staff = this.get('staff');
    const filter = this.get('filter');
    const regEx = new RegExp(filter, 'i');
    if (filter === '') {
      return staff.sortBy('fullName');
    }
    return staff
      .filter((staff) => regEx.test(staff.get('fullName')))
      .sortBy('fullName');
  }),

  canAddTeamMembers: computed(function() {
    let permissions = this.get('permissions');

    return permissions.has('users.update');
  })
});
