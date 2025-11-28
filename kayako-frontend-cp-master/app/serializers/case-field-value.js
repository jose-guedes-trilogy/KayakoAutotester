import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  normalize(modelType, payload) {
    payload.field_id = payload.field.id;
    Reflect.deleteProperty(payload, 'field');
    return this._super(...arguments);
  }
});
