import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  attrs: {
    account: { serialize: false }
  },

  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    payload.data.id = 1;
    return this._super(store, primaryModelClass, payload, id, requestType);
  }
});
