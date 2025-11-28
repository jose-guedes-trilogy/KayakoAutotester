import Mirage from 'ember-cli-mirage';
import gatherSideloadedResources from 'frontend-cp/mirage/utils/gather-sideloaded-resources';

export default function handlePostUserFields(schema, request) {
  const requestData = JSON.parse(request.requestBody);

  const newCustomerTitles = [];
  const customerTitles = requestData.customer_titles;
  Reflect.deleteProperty(requestData, 'customer_titles');
  if (customerTitles) {
    customerTitles.forEach((customerTitle) => {
      const newField = schema.db.localeFields.insert(customerTitle);
      newCustomerTitles.push({ id: newField.id, resource_type: 'locale_field' });
    });
  }

  const newDescriptions = [];
  const descriptions = requestData.descriptions;
  Reflect.deleteProperty(requestData, 'descriptions');
  if (descriptions) {
    descriptions.forEach((description) => {
      const newField = schema.db.localeFields.insert(description);
      newDescriptions.push({ id: newField.id, resource_type: 'locale_field' });
    });
  }

  const newOptions = [];
  const options = requestData.options;
  Reflect.deleteProperty(requestData, 'options');
  if (options) {
    options.forEach((option) => {
      const newValues = [];
      option.values.forEach((value) => {
        const newField = schema.db.localeFields.insert(value);
        newValues.push({ id: newField.id, resource_type: 'locale_field' });
      });
      option.values = newValues;
      const newField = schema.db.fieldOptions.insert(option);
      newOptions.push({ id: newField.id, resource_type: 'field_option' });
    });
  }

  requestData.resource_type = 'user_field';
  let responseData = schema.db.userFields.insert(requestData);

  responseData.customer_titles = newCustomerTitles;
  responseData.descriptions = newDescriptions;
  responseData.options = newOptions;

  let resources = gatherSideloadedResources(schema.db, responseData);

  let payload = {
    status: 201,
    data: responseData,
    resource: 'user_field',
    resources
  };
  return new Mirage.Response(201, {}, payload);
}
