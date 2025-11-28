import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  serialize(snapshot, options) {
    let json = this._super(...arguments);
    if ('isValidated' in snapshot.changedAttributes()) {
      Reflect.deleteProperty(json, 'email');
      Reflect.deleteProperty(json, 'user_id');
    }
    return json;
  }
});
