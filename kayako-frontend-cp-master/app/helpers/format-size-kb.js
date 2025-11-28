import { helper } from '@ember/component/helper';

export function formatSizeKb([size]) {
  return (size / 1024).toFixed(2);
}

export default helper(formatSizeKb);
