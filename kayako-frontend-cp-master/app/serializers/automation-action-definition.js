import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  primaryKey: 'name',

  extractAttributes(modelClass, resourceHash) {
    resourceHash.values = Object.keys(resourceHash.values || {})
      .map(key => ({ id: key, value: resourceHash.values[key] }));
    return this._super(...arguments);
  }
});
