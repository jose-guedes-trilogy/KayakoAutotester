import Ember from 'ember';
import { inject as service } from '@ember/service';
import { makeArray } from '@ember/array';
import { underscore } from '@ember/string';
import { assign } from '@ember/polyfills';
import DS from 'ember-data';
import _ from 'npm:lodash';

const errorCodes = [
  'FIELD_REQUIRED',
  'FIELD_DUPLICATE',
  'FIELD_EMPTY',
  'FIELD_INVALID'
];
const errorMessages = _.fromPairs(errorCodes.map(e => [e, `generic.error.${e.toLowerCase()}`]));
const isValidationError = e => errorCodes.includes(e.code);
const inflector = new Ember.Inflector(Ember.Inflector.defaultRules);

export default DS.RESTSerializer.extend({
  isNewSerializerAPI: true,

  i18n: service(),

  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    const resourceName = payload.resource;

    payload = this._normalizePayload(payload);

    // Ensures only one record is returned for queryRecord:
    // DEPRECATION: The adapter returned an array for the primary data of a `queryRecord` response.
    // This is deprecated as `queryRecord` should return a single record.
    // [deprecation id: ds.serializer.rest.queryRecord-array-response]
    if (requestType === 'queryRecord') {
      const primaryKey = inflector.pluralize(resourceName);
      const primaryData = payload[primaryKey];
      payload[inflector.singularize(resourceName)] = primaryData[0];
      Reflect.deleteProperty(payload, primaryKey);
    }

    return this._super(...arguments);
  },

  keyForAttribute(key/*, method*/) {
    return underscore(key);
  },

  extractRelationships(modelClass, resourceHash) {
    modelClass.eachRelationship(function(name, relationship) {
      let underscoredName = underscore(name);
      if (resourceHash[underscoredName]) {
        if (relationship.kind === 'belongsTo') {
          let data = resourceHash[underscoredName];
          if (!data.hasOwnProperty('id') || !data.hasOwnProperty('type') || Object.keys(data).length !== 2) {
            resourceHash[underscoredName] = { id: data.id, type: data.resource_type };
          }
        } else { // has many
          resourceHash[underscoredName].forEach(entry => {
            entry.type = entry.resource_type;
            Reflect.deleteProperty(entry, 'resource_type');
          });
        }
      }
    });
    return this._super(...arguments);
  },

  extractMeta(store, typeClass, payload) {
    if (payload.meta) {
      if (typeof payload.meta.total_count !== 'undefined') {
        payload.meta.total = payload.meta.total_count;
        Reflect.deleteProperty(payload.meta, 'total_count');
      }
      if (typeof payload.meta.next_url !== 'undefined') {
        payload.meta.next = payload.meta.next_url;
        Reflect.deleteProperty(payload.meta, 'next_url');
      }
    }
    return this._super(...arguments);
  },

  keyForRelationship(key, relationship, method) {
    if (!method || method === 'serialize') {
      return underscore(key) + (relationship === 'belongsTo' ? '_id' : '');
    } else {
      return underscore(key);
    }
  },

  serializeIntoHash(hash, type, snapshot, options) {
    assign(hash, this.serialize(snapshot, options));
  },

  serialize(snapshot, options) {
    let json = this._super(...arguments);
    let customTypePropertyName = underscore(snapshot.modelName) + '_type';

    if (json.hasOwnProperty(customTypePropertyName)) {
      json.type = json[customTypePropertyName];
      Reflect.deleteProperty(json, customTypePropertyName);
    }
    if (json.hasOwnProperty('viewNotes')) {
      Reflect.deleteProperty(json, 'viewNotes');
    }
    return json;
  },

  extractErrors(store, typeClass, payload, id) {
    if (payload && typeof payload === 'object' && payload.errors) {
      let messageForError = e => this.get('i18n').t(errorMessages[e.code]);
      let errors = [];
      payload.errors.forEach(error => {
        if (isValidationError(error)) {
          errors.push({
            detail: messageForError(error),
            source: {
              pointer: `data/attributes/${this._formatJSONPointer(error.parameter)}`
            },
            parameter: error.parameter
          });
        }
      });
      payload.errors = errors;
    }
    return this._super(...arguments);
  },

  _formatJSONPointer(pointer) {
    // ember data breaks with .s - just change how we look for them
    pointer = pointer.replace('.', '-');

    // API returns arrays as <relationshipName>[<index>] - JSONPointer expects it as a slash - <relationshipName>/<index>
    pointer = pointer.replace('[', '/').replace(']', '');
    return pointer;
  },

  pushPayload(store, payload) {
    payload = this._normalizePayload(payload);
    this._super(store, payload);
  },

  _normalizePayload(payload) {
    payload[inflector.pluralize(payload.resource)] = makeArray(payload.data);
    Reflect.deleteProperty(payload, 'status');
    Reflect.deleteProperty(payload, 'resource');
    Reflect.deleteProperty(payload, 'logs');

    Object.keys(payload.resources || {}).forEach(function(modelType) {
      payload[inflector.pluralize(modelType)] = Object.values(payload.resources[modelType]);
    });

    Reflect.deleteProperty(payload, 'resources');
    Reflect.deleteProperty(payload, 'data');
    Object.keys(payload).forEach(function(key) {
      let value = payload[key];
      if (Array.isArray(value)) {
        value.forEach(function(resource) {
          if (resource.hasOwnProperty('resource_type')) {
            if (resource.hasOwnProperty('type')) {
              resource[resource.resource_type + '_type'] = resource.type;
            }
            resource.type = resource.resource_type;
            Reflect.deleteProperty(resource, 'resource_type');
          }
        });
      }
    });
    let hasMeta = false;
    let meta = ['total_count', 'offset', 'next_url', 'limit'].reduce(function(meta, attrName) {
      if (payload.hasOwnProperty(attrName)) {
        meta[attrName] = payload[attrName];
        Reflect.deleteProperty(payload, attrName);
        hasMeta = true;
      }
      return meta;
    }, {});
    if (hasMeta) { payload.meta = meta; }
    return payload;
  }
});
