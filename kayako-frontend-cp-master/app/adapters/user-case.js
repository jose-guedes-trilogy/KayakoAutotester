import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  autoIncludeAll: false,

  urlForQuery(query, modelName) {
    let id = query.userId;
    let statuses = query.statuses;
    this._super(...arguments);
    Reflect.deleteProperty(query, 'userId');
    Reflect.deleteProperty(query, 'statuses');
    return `/api/v1/users/${id}/cases?status=${statuses}&include=case_status,user,read_marker`;
  }
});
