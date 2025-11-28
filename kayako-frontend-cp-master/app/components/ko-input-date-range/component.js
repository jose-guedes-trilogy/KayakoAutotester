import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { computed } from '@ember/object';
import moment from 'moment';

export default Component.extend({
  i18n: service(),
  date: service(),
  localClassNames: ['chartDateRange'],
  rangeStart: null,
  rangeEnd: null,
  onRangeApplied: () => {},
  onPickerHidden: () => {},

  ranges: computed(function() {
    const i18n = this.get('i18n');

    let options = {};

    let today = i18n.t('generic.input_date_range.today');
    let yesterday = i18n.t('generic.input_date_range.yesterday');
    let last7Days = i18n.t('generic.input_date_range.last7days');
    let last30Days = i18n.t('generic.input_date_range.last30days');
    let thisMonth = i18n.t('generic.input_date_range.this_month');
    let lastMonth = i18n.t('generic.input_date_range.last_month');

    let currentDate = this.get('date').getCurrentDate();

    options[today] = [moment(currentDate), moment(currentDate)];
    options[yesterday] = [moment().subtract(1, 'days'), moment().subtract(1, 'days')];
    options[last7Days] = [moment().subtract(7, 'days'), moment()];
    options[last30Days] = [moment().subtract(30, 'days'), moment()];
    options[thisMonth] = [moment().startOf('month'), moment().endOf('month')];
    options[lastMonth] = [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')];

    return options;
  }),

  daysOfWeek: moment.weekdaysMin(),
  monthNames: moment.monthsShort(),

  actions: {
    openDatePicker() {
      this.$().find('.daterangepicker-input').trigger('click');
    }
  }
});
