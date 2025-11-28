import ApplicationSerializer from './application';
import { serializeCustomFields } from 'frontend-cp/lib/custom-field-serialization';
import { inject as service } from '@ember/service';

export default ApplicationSerializer.extend({
  plan: service(),
  attrs: {
    phones: { serialize: false },
    notes: { serialize: false },
    customFields: { serialize: false },
    createdAt: { serialize: false },
    updatedAt: { serialize: false }
  },

  extractRelationships(modelClass, resourceHash) {
    resourceHash.links = {
      notes: 'notes',
      tags: 'tags'
    };
    return this._super(...arguments);
  },

  serialize(snapshot, options) {
    let json = this._super(...arguments);
    let plan = this.get('plan');
    if (!plan.has('shared_organizations')) {
      Reflect.deleteProperty(json, 'is_shared');
    }
    json.field_values = serializeCustomFields(snapshot.attr('customFields'));
    return json;
  },

  serializeHasMany(snapshot, json, relationship) {
    if (relationship.key === 'tags') {
      json.tags = (snapshot.hasMany('tags') || []).map(snapshot => snapshot.attr('name')).toString();
    } else if (relationship.key === 'domains') {
      json.domains = (snapshot.hasMany('domains') || []).map(snapshot => snapshot.attr('domain')).uniq().toString();
    } else {
      this._super(...arguments);
    }
  },

  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    const normalized = this._super(...arguments);
    if (requestType === 'findRecord') {
      normalized.data.attributes._isFullyLoaded = true;
    }
    return normalized;
  }
});
