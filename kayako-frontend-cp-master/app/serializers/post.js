import ApplicationSerializer from './application';

import { addResourcesToActivity } from './activity';

export default ApplicationSerializer.extend({
  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    if (payload.resources && payload.resources.activity) {
      Object.keys(payload.resources.activity).forEach((activityId) => {
        let activity = payload.resources.activity[activityId];
        addResourcesToActivity(activity);
      });
    }

    return this._super(store, primaryModelClass, payload, id, requestType);
  }
});
