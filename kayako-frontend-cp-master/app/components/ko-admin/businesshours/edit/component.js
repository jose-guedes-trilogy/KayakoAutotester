import _ from 'npm:lodash';
import moment from 'moment';
import EmberObject from '@ember/object';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import Component from '@ember/component';
import { task } from 'ember-concurrency';

// Weekday codes that match with businessHour.zones keys in order matching moment.weekdays()
const LOCALE_WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default Component.extend({
  tagName: '',

  // Attributes
  title: null,
  schema: null,
  businessHour: null,
  editedBusinessHour: null,
  onCancel: () => {},
  onSave: () => {},
  onDelete: () => {},

  // Services
  confirmation: service(),
  errorHandler: service(),
  virtualModel: service(),

  // State
  newHoliday: null,

  // CPs
  titles: computed('businessHour.zones', function() {
    let weekdays = [...moment.weekdays()];
    _.times(moment.localeData().firstDayOfWeek(), () => weekdays.push(weekdays.shift()));
    return weekdays;
  }).readOnly(),

  localeWeekdays: computed(function() {
    let result = [...LOCALE_WEEKDAYS];
    _.times(moment.localeData().firstDayOfWeek(), () => result.push(result.shift()));
    return result;
  }).readOnly(),

  businessHourGrid: computed('editedBusinessHour', function() {
    let localeWeekdays = this.get('localeWeekdays');

    return localeWeekdays.map(weekday => {
      return _.range(24).map(col => this.get('editedBusinessHour.zones')[weekday].includes(col));
    });
  }).readOnly(),

  hoursLegend: computed(function() {
    return _.range(24).map((hour) => {
      const label = `${hour}:00`;
      return hour < 10 ? `0${label}` : label;
    });
  }),

  canBeDeleted: computed('businessHour.isDefault', 'businessHour.isNew', function() {
    return !(this.get('businessHour.isNew') || this.get('businessHour.isDefault'));
  }),

  isDisabled: computed.or('save.isRunning', 'performDelete.isRunning'),

  // Tasks
  save: task(function * () {
    const businessHour = this.get('businessHour');
    const editedBusinessHour = this.get('editedBusinessHour');

    yield this.get('virtualModel').save(businessHour, editedBusinessHour, this.get('schema'));
    const duplicated = businessHour.get('holidays').filterBy('id', null);
    duplicated.forEach(holiday => holiday.unloadRecord());
    this.get('onSave')();
  }).drop(),

  confirmDelete: task(function * () {
    yield this.get('confirmation').confirm({
      intlConfirmationBody: 'admin.businesshours.labels.delete_confirmation',
      intlConfirmationHeader: 'admin.businesshours.labels.confirm_delete',
      intlConfirmLabel: 'generic.confirm.delete_button'
    });
    yield this.get('performDelete').perform();
    this.get('onDelete');
  }).drop(),

  performDelete: task(function * () {
    yield this.get('businessHour').destroyRecord();
  }).drop(),

  actions: {
    businessHourRangeSelect(grid) {
      let zones = {};
      let localeWeekdays = this.get('localeWeekdays');

      localeWeekdays.forEach((weekday, index) => {
        zones[weekday] = grid[index].map((col, index) => {
          return col ? index : col;
        }).filter((col) => col !== false);
      });
      this.set('editedBusinessHour.zones', zones);
    },

    showHolidayForm() {
      this.set('newHoliday', EmberObject.create({
        title: '',
        date: '',
        openHours: []
      }));
    },

    cancelAddingHoliday() {
      this.set('newHoliday', null);
    },

    deleteHoliday(holiday) {
      this.get('editedBusinessHour.holidays').removeObject(holiday);
    },

    addHoliday() {
      this.get('editedBusinessHour.holidays').pushObject(this.get('newHoliday'));
      this.set('newHoliday', null);
    }
  }
});
