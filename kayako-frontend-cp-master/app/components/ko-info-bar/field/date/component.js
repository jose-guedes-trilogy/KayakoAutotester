import $ from 'jquery';
import { guidFor } from '@ember/object/internals';
import Component from '@ember/component';
import { computed } from '@ember/object';
import moment from 'moment';

export default Component.extend({
  tagName: '',

  // Attributes
  title: '',
  isErrored: false,
  isEdited: false,
  isDisabled: false,
  value: null,
  onValueChange: null,
  emptyLabel: '-',

  // State
  isFocused: false,
  isCalendarShown: false,

  // CPs
  valueAsDate: computed('value', function() {
    let value = this.get('value');

    if (!value) {
      return value;
    }

    let convertedDate = moment.utc(value, 'YYYY-MM-DD');
    let year = convertedDate.get('year');
    let month = convertedDate.get('month');
    let day = convertedDate.get('date');
    let date = new Date(year, month, day);

    return date;
  }),

  init() {
    this._super(...arguments);
    this.uniqueId = guidFor(this);
  },

  actions: {
    mouseDown(e) {
      if (!this.get('isDisabled') && !this.get('isCalendarShown')) {
        e.preventDefault();
        $(`#${this.get('uniqueId')}`).focus();
      }
    },

    focus() {
      this.set('isCalendarShown', true);
    },

    blur() {
      this.set('isCalendarShown', false);
    },

    hide() {
      this.set('isCalendarShown', false);
    },

    preserveFocus(e) {
      e.preventDefault();
      e.stopPropagation();
    },

    dateChange(value) {
      const date = dateToTimestamp(value);

      this.attrs.onValueChange(date);
      this.set('isCalendarShown', false);
    }
  }
});

function dateToTimestamp(date) {
  const m = moment(date);

  if (!m.isValid()) {
    return '';
  }

  const year = m.get('year');
  const month = m.get('month');
  const day = m.get('date');
  const result = moment([year, month, day]);

  return result.format('YYYY-MM-DDTHH:mm:ss+0000');
}
