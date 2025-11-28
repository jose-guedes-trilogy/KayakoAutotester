import leftPad from './left-pad';

export function monthFormat(date) {
  return date.getUTCFullYear() + '-' + leftPad((date.getUTCMonth() + 1)) + '-' + leftPad(date.getUTCDate());
}

export function getMonthAt(period = 'start', monthDiff = 0) {
  let date = new Date();
  let month = date.getMonth();
  let day = 1;
  let hour = 0;
  let minute = 0;
  let second = 0;

  if (period === 'end') {
    month += 1;
    day = 0;
    hour = 23;
    minute = 59;
    second = 59;
  }

  let range = new Date(date.getUTCFullYear(), month + monthDiff, day, hour, minute, second);

  return range.getUTCFullYear() + '-' + leftPad((range.getUTCMonth() + 1)) + '-' + leftPad(range.getUTCDate());
}

export function getWeekAt(period = 'start', weekDiff = 0) {
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + (weekDiff * 7));

  let monday = (currentDate.getDate() - currentDate.getDay()) + 1;
  let sunday = monday + 6;

  let range = new Date(currentDate.setDate(monday));
  range.setHours(0);
  range.setMinutes(0);
  range.setSeconds(0);

  if (period === 'end') {
    range = new Date(currentDate.setDate(sunday));
    range.setHours(23);
    range.setMinutes(59);
    range.setSeconds(59);
  }

  return range.getUTCFullYear() + '-' + leftPad((range.getUTCMonth() + 1)) + '-' + leftPad(range.getUTCDate());
}
