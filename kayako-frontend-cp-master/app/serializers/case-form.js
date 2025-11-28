import ApplicationSerializer from './application';
import DS from 'ember-data';
import _ from 'npm:lodash';

export default ApplicationSerializer.extend(DS.EmbeddedRecordsMixin, {
  attrs: {
    customerTitles: {embedded: 'always'},
    descriptions: {embedded: 'always'},
    fields: {serialize: 'ids'}
  },

  keyForRelationship(key, relationship, method) {
    if ((!method || method === 'serialize') && relationship === 'hasMany' && key === 'fields') {
      return 'case_field_ids';
    } else {
      return this._super(...arguments);
    }
  },

  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    let data = payload.data || {};

    let customerTitles = data.customer_titles;
    let customerTitlesBc = customerTitles && _.isArray(customerTitles) && !customerTitles.length && data.customer_title;

    let descriptions = data.descriptions;
    let descriptionsBc = descriptions && _.isArray(descriptions) && !descriptions.length && data.description;

    if (customerTitlesBc) {
      let id = `ct-${new Date().getTime()}`;

      payload.data.customer_titles.push({
        id: id,
        resource_type: 'locale_field'
      });

      payload.resources.locale_field[id] = {
        created_at: new Date().toISOString(),
        id: id,
        locale: 'en-us',
        resource_url: '',
        translation: data.customer_title,
        type: 'locale_field',
        updated_at: new Date().toISOString()
      };
    }

    if (descriptionsBc) {
      let id = `d-${new Date().getTime()}`;

      payload.data.descriptions.push({
        id: id,
        resource_type: 'locale_field'
      });

      payload.resources.locale_field[id] = {
        created_at: new Date().toISOString(),
        id: id,
        locale: 'en-us',
        resource_url: '',
        translation: data.description,
        type: 'locale_field',
        updated_at: new Date().toISOString()
      };
    }

    return this._super(...arguments);
  },

  serialize() {
    let json = this._super(...arguments);

    Reflect.deleteProperty(json, 'customer_title');
    Reflect.deleteProperty(json, 'description');

    return json;
  }
});
