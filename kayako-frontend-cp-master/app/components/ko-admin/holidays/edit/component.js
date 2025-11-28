import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { on } from '@ember/object/evented';
import _ from 'npm:lodash';
import moment from 'moment';
import { attr, list, model } from 'frontend-cp/services/virtual-model';

const schema = model('businesshour-holiday', {
  title: attr(),
  date: attr(),
  openHours: list()
});

export default Component.extend({
  tagName: '',

  // Attributes
  holiday: null,
  onCancel: null,

  // Services
  virtualModel: service(),

  initEditedHoliday: on('init', function () {
    this.set('editedHoliday', this.get('virtualModel').makeSnapshot(this.get('holiday'), schema));
  }),

  holidayGrid: computed('editedHoliday.openHours.[]', function() {
    const openHours = this.get('editedHoliday.openHours');
    return [_.range(24).map((hour) => openHours.includes(hour))];
  }).readOnly(),

  hoursLegend: computed(function() {
    return _.range(24).map((hour) => {
      const label = `${hour}:00`;
      return hour < 10 ? `0${label}` : label;
    });
  }),

  holidayDate: computed('editedHoliday.date', function() {
    return this.get('editedHoliday.date') ? moment(this.get('editedHoliday.date'), 'DD/MM/YYYY').toDate() : null;
  }),

  actions: {
    selectHolidayDate(date) {
      this.set('editedHoliday.date', date ? moment(date).format('DD/MM/YYYY') : null);
    },

    selectRange(grid) {
      const hours = grid.get('firstObject').map((col, index) => col ? index : col);
      this.set('editedHoliday.openHours', hours.filter((col) => col !== false));
    },

    save(event) {
      event.stopPropagation();
      if (!this.get('editedHoliday.date')) {
        this.set('editedHoliday.date', moment().format('DD/MM/YYYY'));
      }

      this.get('virtualModel').patch(this.get('holiday'), this.get('editedHoliday'), schema);
      this.get('onSave')();
    },

    cancelEditing(event) {
      event.stopPropagation();
      this.get('onCancel')();
    }
  }
});
