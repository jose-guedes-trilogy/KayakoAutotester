import ApplicationSerializer from './application';
import { serializeCustomFields } from 'frontend-cp/lib/custom-field-serialization';
import _ from 'npm:lodash';
import { inject as service } from '@ember/service';

function getPrimaryEmailAddress(snapshot) {
  return snapshot.hasMany('emails')
    .filter(identityEmail => identityEmail.attr('isPrimary'))
    .map(identityEmail => identityEmail.attr('email'))[0] || null;
}

export default ApplicationSerializer.extend({
  store: service(),
  plan: service(),

  attrs: {
    avatar: { serialize: false },
    phones: { serialize: false },
    twitter: { serialize: false },
    facebook: { serialize: false },
    customFields: { serialize: false },
    notes: { serialize: false },
    passwordUpdateAt: { serialize: false },
    avatarUpdateAt: { serialize: false },
    activityAt: { serialize: false },
    visitedAt: { serialize: false },
    createdAt: { serialize: false },
    updatedAt: { serialize: false },
    teams: {serialize: false},
    permissions: {serialize: false}
  },

  extractAttributes(modelClass, resourceHash) {
    const locales = this.get('store').peekAll('locale');

    // TODO: this check is to have B/C for locale being object or string
    if (!_.isObject(resourceHash.locale)) {
      let locale;
      locales.forEach((record) => {
        if (record.get('locale') === resourceHash.locale) {
          locale = record;
        }
      });

      if (!locale) {
        locale = locales.get('firstObject');
      }

      resourceHash.locale = {
        id: locale.id,
        type: 'locale'
      };
    }

    return this._super(...arguments);
  },

  extractRelationships(modelClass, resourceHash) {
    resourceHash.links = {
      notes: 'notes',
      tags: 'tags',
      recentCases: 'cases'
    };

    return this._super(...arguments);
  },

  serializeHasMany(snapshot, json, relationship) {
    if (relationship.key === 'teams') {
      if (json.role_id !== '4') {
        json.team_ids = (snapshot.hasMany('teams') || []).map(snapshot => snapshot.id).join(',');
      }
    } else if (relationship.key === 'tags') {
      json.tags = (snapshot.hasMany('tags') || []).map(snapshot => snapshot.attr('name')).join(',');
    } else if (relationship.key === 'emails') {
      json.email = getPrimaryEmailAddress(snapshot);
    } else {
      this._super(...arguments);
    }
  },

  serializeAttribute(snapshot, json, key, attribute) {
    if (key === 'fieldValues') {
      json.field_values = serializeCustomFields(snapshot.attr('customFields'));
      if (Object.keys(json.field_values).length === 0) {
        Reflect.deleteProperty(json, 'field_values');
      }
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
  },

  serialize(snapshot, options) {
    let json = this._super(...arguments);
    let plan = this.get('plan');
    if (!plan.has('shared_organizations')) {
      Reflect.deleteProperty(json, 'organization_case_access');
    }
    if (snapshot.adapterOptions) {
      if (snapshot.adapterOptions.setOrganization) {
        json = {organization_id: json.organization_id};
      }
      if (snapshot.adapterOptions.setSignature) {
        json = {signature: json.signature};
      }
      if (snapshot.adapterOptions.toggleUser) {
        json = {is_enabled: json.is_enabled};
      }
      if (snapshot.adapterOptions.updateName) {
        json = {full_name: json.full_name};
      }
    }

    return json;
  }
});
