import DS from 'ember-data';
import ApplicationSerializer from './application';

export default ApplicationSerializer.extend(DS.EmbeddedRecordsMixin, {
  attrs: {
    createdAt: { serialize: false },
    executionOrder: { serialize: false },
    isDeleted: { serialize: false },
    updatedAt: { serialize: false },
    targets: { serialize: 'records' },
    predicateCollections: { serialize: 'records' }
  }
});
