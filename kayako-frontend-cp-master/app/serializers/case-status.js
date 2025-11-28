import { get } from '@ember/object';
import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  extractAttributes(modelClass, resourceHash) {
    if (resourceHash.case_status_type) {
      resourceHash.status_type = resourceHash.case_status_type;
      Reflect.deleteProperty(resourceHash, 'case_status_type');
    }
    return this._super(...arguments);
  },

  serializeHasMany: function(snapshot, json, relationship) {
    const key = relationship.key;
    json[key] = get(snapshot, key).map(function (obj) {
      return obj.serialize({ includeId: false });
    });

    if (json[key].length === 0) {
      Reflect.deleteProperty(json, key);
    }

    return json;
  }
});
