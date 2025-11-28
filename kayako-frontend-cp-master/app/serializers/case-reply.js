import ApplicationSerializer from './application';
import {
  serializeCustomFields,
  serializeChannelOptions
} from 'frontend-cp/lib/custom-field-serialization';
import uuid from 'npm:uuid/v4';

export default ApplicationSerializer.extend({
  attrs: {
    channelType: { key: 'channel' },
    caseType: { key: 'type_id' },
    case: { serialize: false },
    posts: { serialize: false }
  },

  serialize(snapshot, options) {
    let json = this._super(snapshot, options);
    let form = snapshot.belongsTo('form');

    json.field_values = serializeCustomFields(snapshot.attr('fieldValues'), form);

    json = serializeChannelOptions(json, snapshot.attr('channelOptions'));

    return json;
  },

  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    store.peekRecord(payload.data.case.resource_type, payload.data.case.id).rollbackAttributes();
    return this._super(store, primaryModelClass, payload, id, requestType);
  },

  normalizeCreateRecordResponse(store, primaryModelClass, payload, id, requestType) {
    let idToUse = id || uuid();
    payload.case_replies[0].id = idToUse;
    return this._super(store, primaryModelClass, payload, id, requestType);
  }
});
