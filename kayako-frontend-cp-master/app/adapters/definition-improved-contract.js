import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  urlForQuery(query, modelName) {
    const type = query.type;
    Reflect.deleteProperty(query, 'type');

    switch (type) {
      case 'view':
        return `${this.namespace}/views/definitions`;
      case 'sla':
        return `${this.namespace}/slas/definitions`;
      case 'monitor':
        return `${this.namespace}/monitors/definitions`;
      case 'trigger':
        return `${this.namespace}/triggers/definitions`;
      case 'engagement':
        return `${this.namespace}/engagements/definitions`;
      case 'report':
        return `${this.namespace}/reports/definitions`;
      case 'user':
        return `${this.namespace}/users/definitions`;
      case 'organization':
        return `${this.namespace}/organizations/definitions`;
    }
  }
});
