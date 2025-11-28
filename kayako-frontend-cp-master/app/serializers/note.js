import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  attrs: {
    createdAt: { serialize: false },
    updatedAt: { serialize: false }
  },

  serialize(snapshot, options) {
    let json = this._super(snapshot, options);
    json.is_html = true;
    return json;
  }
});
