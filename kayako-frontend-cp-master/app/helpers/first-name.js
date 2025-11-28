import { capitalize } from '@ember/string';
import Helper from '@ember/component/helper';

export function firstName(name) {
  if (Array.isArray(name)) {
    name = name[0];
  }

  if (typeof name !== 'string') {
    return;
  }

  name = name.trim();
  if (name.length) {
    name = name.split(' ').get('firstObject');
  }
  return capitalize(name);
}

export default Helper.helper(firstName);
