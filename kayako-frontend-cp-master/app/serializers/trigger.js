import DS from 'ember-data';
import ApplicationSerializer from './application';

export default ApplicationSerializer.extend(DS.EmbeddedRecordsMixin, {
  attrs: {
    createdAt: { serialize: false },
    updatedAt: { serialize: false },
    predicateCollections: { serialize: 'records' },
    actions: { serialize: 'records' }
  }
});
