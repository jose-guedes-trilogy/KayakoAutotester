import { helper } from '@ember/component/helper';

export default helper(([locale]) => {
  if (!locale) {
    return '';
  }

  let flag = locale;
  if (locale.match('-')) {
    flag = locale.substr(locale.indexOf('-') + 1);
  }

  return 'i-png-flag-' + flag;
});
