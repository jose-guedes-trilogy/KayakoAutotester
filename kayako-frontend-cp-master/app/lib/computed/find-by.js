import { computed } from '@ember/object';

export default function(collectionName, key, value) {
  return computed(`${collectionName}.@each.${key}`, function() {
    return (this.get(collectionName) || []).findBy(key, value);
  });
}
