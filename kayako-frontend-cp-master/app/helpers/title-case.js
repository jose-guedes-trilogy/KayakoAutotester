import { helper } from '@ember/component/helper';

export function titleCase([text]) {
  if (typeof text !== 'string') return text;

  // Split by spaces, underscores, and camel case
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // Insert space before capital letters in camel case
    .split(/[\s_]+/)  // Regex to split by space and underscore
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default helper(titleCase);
