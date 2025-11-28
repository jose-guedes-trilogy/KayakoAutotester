import { helper } from '@ember/component/helper';

export default helper(([value]) => {
  return (value || '').toLowerCase();
});
