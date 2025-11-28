import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  urlForQuery(query, modelName) {
    if (query.type === 'monitor') {
      Reflect.deleteProperty(query, 'type');
      return '/api/v1/monitors/actions/definitions';
    } else if (query.type === 'trigger') {
      Reflect.deleteProperty(query, 'type');
      return '/api/v1/triggers/actions/definitions';
    } else if (query.type === 'engagement') {
      Reflect.deleteProperty(query, 'type');
      return '/api/v1/engagements/actions/definitions';
    }
  }
});
