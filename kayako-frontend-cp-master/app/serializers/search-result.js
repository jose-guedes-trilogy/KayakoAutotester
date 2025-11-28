import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  primaryKey: 'resource_url',

  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    payload.resource = 'search_result';
    payload.data.forEach(result => {
      result.resource_type = 'search_result';
      result.result_data = result.data;
    });
    return this._super(store, primaryModelClass, payload, id, requestType);
  }
});
