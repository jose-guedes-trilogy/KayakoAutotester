import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  attrs: {
    createdAt: { serialize: false },
    updatedAt: { serialize: false },
    resourceType: { serialize: false },
    resourceUrl: { serialize: false }
  },

  keyForAttribute(attr) {
    switch (attr) {
      case 'isPrimary': return 'is_primary';
      case 'resourceType': return 'resource_type';
      case 'resourceUrl': return 'resource_url';
      case 'createdAt': return 'created_at';
      case 'updatedAt': return 'updated_at';
      default: return this._super(...arguments);
    }
  }
});
