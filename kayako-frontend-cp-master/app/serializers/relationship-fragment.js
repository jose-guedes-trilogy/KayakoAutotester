import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  extractAttributes(modelClass, resourceHash) {
    resourceHash.relationship_id = resourceHash.id;
    resourceHash.relationship_type = resourceHash.resource_type;
    Reflect.deleteProperty(resourceHash, 'id');
    Reflect.deleteProperty(resourceHash, 'resource_type');
    return this._super(...arguments);
  }
});
