import { helper } from '@ember/component/helper';

export function startsWith([str, prefix]) {
  if (str && prefix) {
    return str.toLowerCase().startsWith(prefix.toLowerCase());
  }
  return false;
}

export default helper(startsWith);
