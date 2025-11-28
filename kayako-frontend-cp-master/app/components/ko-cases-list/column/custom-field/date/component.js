import Component from '@ember/component';
import { computed } from '@ember/object';
import moment from 'moment';

export default Component.extend({
  caseField: null,

  tagName: '',

  valueAsDate: computed('caseField.value', function() {
    const value = this.get('caseField.value');

    if (!value) {
      return value;
    }

    const convertedDate = moment(value, 'YYYY-MM-DD');
    const year = convertedDate.get('year');
    const month = convertedDate.get('month');
    const day = convertedDate.get('date');
    const date = new Date(year, month, day);

    return date;
  })
});
