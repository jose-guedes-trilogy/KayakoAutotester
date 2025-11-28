import { helper } from '@ember/component/helper';
import { htmlSafe } from '@ember/string';

const IMAGE_TAG_REGEX = /\[img (.+?)]/igm;
const LINKIFY_OUTPUT_REGEX = /<a href="(\S+)".*>(.*)/ig;

export function imagify([content]) {
  // This function depends on ko-linkify's output
  content = content.replace(IMAGE_TAG_REGEX, function (match, capture) {
    capture = capture.replace(/&#x3D;/g, '=').replace(/&quot;/g, '"').replace(LINKIFY_OUTPUT_REGEX, '$1 $2');
    return `<img ${capture} />`;
  });
  return htmlSafe(content);
}

export default helper(imagify);
