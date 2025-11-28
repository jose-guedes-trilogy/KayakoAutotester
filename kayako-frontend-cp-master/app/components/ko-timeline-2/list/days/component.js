import Component from '@ember/component';
import moment from 'moment';

export default Component.extend({
  tagName: '',
  items: null,

  helpers: {
    isThisWeek(date) {
      return moment().startOf('week').isBefore(date);
    }
  }
});
