import { get } from '@ember/object';
import { assert } from '@ember/debug';

export function attrChanged(items, key) {
  assert('attrChanged requires a key', key);

  if (!items) {
    return false;
  }

  const [from, to] = items;
  return (from && get(from, key)) !== (to && get(to, key));
}
