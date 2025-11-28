import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    if (!payload.data || !Array.isArray(payload.data)) {
      return this._super(...arguments);
    }

    let originalData = payload.data;
    payload.resources = payload.resources || {};
    payload.resources.notes = payload.data.reduce(function(accum, note) {
      accum[note.id] = note;
      return accum;
    }, {});
    payload.data = [];
    payload.resource = 'user_note';

    if (!originalData[0]) {
      return this._super(...arguments);
    }

    payload.resources.post = [];
    payload.data.forEach((record, i) => {
      payload.resources.post.push({
        id: (new Date()).getTime() + '' + i,
        uuid: (new Date()).getTime() + '' + i,
        sequence: i,
        contents: record.body_text,
        creator: record.user,
        attachments: record.attachments,
        original: {
          id: record.id,
          resource_type: 'note'
        },
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        resource_type: 'post',
        resource_url: record.resource_url
      });
    });

    return this._super(...arguments);
  },

  serialize(snapshot, options) {
    let json = this._super(snapshot, options);
    json.is_html = true;
    return json;
  }
});
