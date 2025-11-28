import Component from '@ember/component';
import { computed } from '@ember/object';
import moment from 'moment';

export default Component.extend({
  holiday: null,
  tagName: '',

  formattedDate: computed('holiday.date', function() {
    return moment(this.get('holiday.date'), 'DD/MM/YYYY');
  }),

  actions: {
    editHoliday() {
      this.set('isEditing', true);
    },

    stopEditing() {
      this.set('errors', []);
      this.set('isEditing', false);
    }
  }
});
