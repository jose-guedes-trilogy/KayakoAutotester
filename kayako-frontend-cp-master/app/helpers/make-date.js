import { helper } from '@ember/component/helper';
import moment from 'moment';

/**
 * @method makeDate
 * @param {String} source - the source string for the date
 * @returns {Date}
 */
export function makeDate([source]) {
  return moment(source).toDate();
}

export default helper(makeDate);
