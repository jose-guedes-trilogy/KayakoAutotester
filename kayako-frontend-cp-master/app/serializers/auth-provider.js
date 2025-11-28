import DS from 'ember-data';

export default DS.JSONAPISerializer.extend({
  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    let convertedData = [];
    let payloadData = (payload.data && payload.data.agent) || [];
    payloadData.forEach(item => {
      convertedData.push({
        id: item.provider_code,
        attributes: {
          scheme: item.scheme,
          'login-url': item.login_url,
          'logout-url': item.logout_url
        },
        type: 'auth_provider'
      });
    });

    return this._super(store, primaryModelClass, { data: convertedData }, id, requestType);
  }
});
