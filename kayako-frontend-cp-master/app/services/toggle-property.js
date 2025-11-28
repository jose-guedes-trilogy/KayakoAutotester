import Service, { inject as service } from '@ember/service';

export default Service.extend({
  store: service(),
  notification: service(),

  toggleProperty(model, successMessage, propertyName = 'isEnabled') {
    const newValue = !model.get(propertyName);

    return this._updatePropertyOnServer(model, propertyName, newValue).then(() => {
      if (successMessage) {
        this.get('notification').success(successMessage);
      }
      model.set(propertyName, newValue);
      model.reload(); // so the model is marked clean. We've already updated the property so we don't need to wait for this call
    });
  },

  _updatePropertyOnServer(model, propertyName, newValue) {
    const modelName = model.constructor.modelName;
    const adapter = this.get('store').adapterFor(modelName);
    const updateURL = adapter.urlForUpdateRecord(model.get('id'), modelName);
    const snakeCaseParameter = propertyName.replace(/([A-Z])/g, function($1) { return '_' + $1.toLowerCase(); });

    let data = {};
    data[snakeCaseParameter] = newValue;
    return adapter.ajax(updateURL, 'PUT', {data: data});
  }
});
