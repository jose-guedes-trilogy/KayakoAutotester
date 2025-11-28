import DS from 'ember-data';

export default DS.JSONAPISerializer.extend({
  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    let data = payload.data || [];
    data = data.map(item => ({
      id: item.type,
      attributes: {
        'device-type': item.type,
        value: item.value
      },
      type: 'device_token'
    }));

    return this._super(store, primaryModelClass, { data }, id, requestType);
  }
});
