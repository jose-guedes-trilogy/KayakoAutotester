import { helper } from '@ember/component/helper';

export default helper(([value]) => {
  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value;
});
