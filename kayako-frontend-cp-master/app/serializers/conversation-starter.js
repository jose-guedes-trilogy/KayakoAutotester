import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  normalizeResponse(store, primaryModelClass, payload) {
    payload.data.id = 1;

    return this._super(...arguments);
  }
});
