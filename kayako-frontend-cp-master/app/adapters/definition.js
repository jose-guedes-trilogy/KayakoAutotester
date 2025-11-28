import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  urlForQuery(query, modelName) {
    const type = query.type;
    Reflect.deleteProperty(query, 'type');

    switch (type) {
      case 'view':
        return '/api/v1/views/definitions';
      case 'sla':
        return '/api/v1/slas/definitions';
      case 'monitor':
        return '/api/v1/monitors/definitions';
      case 'trigger':
        return '/api/v1/triggers/definitions';
      case 'engagement':
        return '/api/v1/engagements/definitions';
      case 'report':
        return '/api/v1/reports/definitions';
      case 'user':
        return '/api/v1/users/definitions';
      case 'organization':
        return '/api/v1/organizations/definitions';
    }
  }
});
