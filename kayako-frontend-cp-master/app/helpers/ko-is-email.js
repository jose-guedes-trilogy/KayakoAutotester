import { helper } from '@ember/component/helper';
import { typeOf } from '@ember/utils';

export function koIsEmail(params/*, hash*/) {
  let term;
  switch (typeOf(params)) {
    case 'array':
      term = params[0];
      break;
    case 'string':
      term = params;
      break;
    default:
      return false;
  }

  return /\S+@\S+\.\S+/.test(term);
}

export default helper(koIsEmail);
