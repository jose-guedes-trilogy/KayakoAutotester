import ApplicationSerializer from './application';
import DS from 'ember-data';

export default ApplicationSerializer.extend(DS.EmbeddedRecordsMixin, {
  attrs: {
    customerTitles: { embedded: 'always' },
    descriptions: { embedded: 'always' },
    options: { embedded: 'always' }
  },

  extractAttributes(modelClass, resourceHash) {
    if (resourceHash.case_field_type) {
      resourceHash.field_type = resourceHash.case_field_type;
      Reflect.deleteProperty(resourceHash, 'case_field_type');
    }
    return this._super(...arguments);
  },

  serialize(snapshot, options) {
    let payload = this._super(...arguments);
    payload.type = payload.field_type;
    Reflect.deleteProperty(payload, 'field_type');
    return payload;
  },

  extractRelationships(modelClass, resourceHash) {
    resourceHash.links = {
      priorities: '/api/v1/cases/priorities',
      statuses: '/api/v1/cases/statuses',
      types: '/api/v1/cases/types'
    };
    return this._super(...arguments);
  }
});
