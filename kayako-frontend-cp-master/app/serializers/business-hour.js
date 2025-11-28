import DS from 'ember-data';
import ApplicationSerializer from './application';

export default ApplicationSerializer.extend(DS.EmbeddedRecordsMixin, {
  attrs: {
    holidays: { embedded: 'always' }
  },
  serialize(snapshot, options) {
    let json = this._super(snapshot, options);
    json.zones = JSON.stringify(json.zones);
    return json;
  }
});
