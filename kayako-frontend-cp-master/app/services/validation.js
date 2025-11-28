import { isBlank } from '@ember/utils';
import Service from '@ember/service';
import _ from 'npm:lodash';
import formatValidator from '../utils/format-validations';

export default Service.extend({
  exists: ((value) => !isBlank(value)),
  isEmail: formatValidator.validateEmailFormat,
  isPhone: formatValidator.validatePhoneFormat,

  /*
   * validates an object with an array of rules
   *
   * @param  {Object} data
   * @param  {Array} rules
   * @param  {Array} messages
   *
   * @return {Object}
   */
  validateAll (data, rules, messages) {
    return _.reduce(data, (result, value, field) => {
      const validation = this.validateField(value, rules[field]);
      if (!validation) {
        result[field] = [{message: messages[field]}];
      }
      return result;
    }, {});
  },

  /*
   * returns a boolean whether the field has
   * failed any of the given validations
   *
   * @param  {Mixed} value
   * @param  {Rules} rules
   *
   * @return {Boolean}
   */
  validateField (value, rules) {
    return _.size(_.filter(rules, (rule) => {
      return !this[rule](value);
    })) <= 0;
  }

});
