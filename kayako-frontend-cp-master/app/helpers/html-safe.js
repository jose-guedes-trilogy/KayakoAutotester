import { helper } from '@ember/component/helper';
import { htmlSafe } from '@ember/string';

export function htmlSafeHelper([htmlString]) {
  return htmlSafe(htmlString);
}

export default helper(htmlSafeHelper);
