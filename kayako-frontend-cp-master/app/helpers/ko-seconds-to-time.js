import { helper } from '@ember/component/helper';
import moment from 'moment';

export function koSecondsToTime(totalSeconds) {
  const duration = moment.duration(totalSeconds[0], 'seconds');
  const days = duration.days();
  const hours = duration.hours();
  const minutes = duration.minutes();
  const seconds = duration.seconds();

  let time = '';
  time += days ? `${days}d ` : '';
  time += hours ? `${hours}h ` : '';
  time += minutes ? `${minutes}m ` : '';
  time += seconds ? `${seconds}s` : '';

  return time;
}

export default helper(koSecondsToTime);
