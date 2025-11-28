import { Presence } from 'phoenix';
import { assign } from '@ember/polyfills';

// Ember adds __ember_meta__ to objects which interferes with Phoenix.Presence.list
// so we sanitize it here before calling through

export function list(presence, cb) {
  const sanitized = assign({}, presence);
  Reflect.deleteProperty(sanitized, '__ember_meta__');
  return Presence.list(sanitized, cb);
}
