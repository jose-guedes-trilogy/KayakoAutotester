import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  extractAttributes(modelClass, json) {
    json.attributes = json.attributes.reduce((obj, attr) => {
      obj[attr.name] = attr.value;
      return obj;
    }, {});
    return this._super(...arguments);
  }
});
