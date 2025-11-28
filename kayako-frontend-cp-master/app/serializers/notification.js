import ApplicationSerializer from './application';
import { addResourcesToActivity } from './activity';

export default ApplicationSerializer.extend({
  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    if (payload.resources && payload.resources.activity) {
      let obj = payload.resources.activity;
      Object.keys(obj).forEach(key => addResourcesToActivity(obj[key]));
    }
    return this._super(store, primaryModelClass, payload, id, requestType);
  }
});

