import ApplicationSerializer from './application';
import { assign } from '@ember/polyfills';

export default ApplicationSerializer.extend({
  extractRelationships(modelClass, resourceHash) {
    resourceHash.links = {
      strings: 'strings'
    };
    return this._super(...arguments);
  },

  normalize(modelClass, resourceHash) {
    resourceHash = normalizeIsLocalized(resourceHash);

    return this._super(modelClass, resourceHash);
  }
});

export function normalizeIsLocalized(resourceHash) {
  let result = assign({}, resourceHash);
  let isLocalised = result.is_localised;

  Reflect.deleteProperty(result, 'is_localised');

  if (result.is_localized === undefined) {
    result.is_localized = isLocalised;
  }

  return result;
}
