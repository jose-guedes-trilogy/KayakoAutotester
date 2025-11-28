/**
 * Checks if a tag is a system tag
 * @param {Object} tag - The tag object to check
 * @returns {Boolean} - True if the tag is a system tag, false otherwise
 */
export default function isSystemTag(tag) {
  if (!tag) {
    return false;
  }
  
  return tag.tagtype === 'SYSTEM';
}
