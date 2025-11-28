import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  urlForQuery(query, modelName) {
    if (query.type === 'engagement') {
      Reflect.deleteProperty(query, 'type');
      return '/api/v1/engagements/actions/definitions';
    }
  }
});
