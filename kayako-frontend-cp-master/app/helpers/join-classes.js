import { helper } from '@ember/component/helper';

export function joinClasses(params) {
  return params.join(' ');
}

export default helper(joinClasses);
