import { helper } from '@ember/component/helper';

export default helper(([value, signs = 1]) => {
  return Math.round(value * signs) / signs;
});
