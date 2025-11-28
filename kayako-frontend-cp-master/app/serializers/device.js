import DS from 'ember-data';
import ApplicationSerializer from './application';

export default ApplicationSerializer.extend(DS.EmbeddedRecordsMixin, {
  attrs: {
    deviceProperties: { embedded: 'always' }
  },

  serialize(snapshot, options) {
    let json = this._super(snapshot, options);
    json.deviceType = json.type;
    delete json.type;
    return json;
  }
});
