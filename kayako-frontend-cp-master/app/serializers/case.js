import ApplicationSerializer from './application';
import {
  serializeCustomFields,
  serializeChannelOptions
} from 'frontend-cp/lib/custom-field-serialization';

export default ApplicationSerializer.extend({
  attrs: {
    portal: { serialize: false },
    slaMetrics: { serialize: false },
    creationMode: { serialize: false },
    hasNotes: { serialize: false },
    hasAttachments: { serialize: false },
    rating: { serialize: false },
    ratingStatus: { serialize: false },
    createdAt: { serialize: false },
    updatedAt: { serialize: false },
    lastAgentActivityAt: { serialize: false },
    lastCustomerActivityAt: { serialize: false },
    lastCompletedAt: { serialize: false },
    sourceChannel: { serialize: false },
    view: { serialize: false },
    replyChannels: { serialize: false },
    lastReplier: { serialize: false },
    lastReplierIdentity: { serialize: false },
    lastAssignedBy: { serialize: false },
    slaVersion: { serialize: false },
    identity: { serialize: false },
    realtimeChannel: { serialize: false },
    creator: { serialize: false },
    state: { serialize: false }
  },

  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    const normalized = this._super(...arguments);
    if (requestType === 'findRecord' || requestType === 'createRecord') {
      normalized.data.attributes._isFullyLoaded = true;
    }
    return normalized;
  },

  extractAttributes(modelClass, resourceHash) {
    if (resourceHash.brand && !Object.keys(resourceHash.brand).length) {
      Reflect.deleteProperty(resourceHash, 'brand');
    }

    return this._super(...arguments);
  },

  extractRelationships(modelClass, resourceHash) {
    resourceHash.links = {
      messages: 'messages',
      posts: 'posts',
      activities: 'activities',
      replyChannels: 'reply/channels?include=chat,facebook_account,facebook_page,mailbox,twitter_account',
      tags: 'tags'
    };
    return this._super(...arguments);
  },

  serializeHasMany(snapshot, json, relationship) {
    if (relationship.key === 'tags') {
      json.tags = (snapshot.hasMany('tags') || []).map(snapshot => snapshot.attr('name')).join(',');
    } else {
      this._super(...arguments);
    }
  },

  serialize(snapshot, options) {
    let json = this._super(snapshot, options);

    json.field_values = serializeCustomFields(snapshot.attr('customFields'), snapshot.belongsTo('form'));
    json.type_id = json.case_type_id && parseInt(json.case_type_id, 10);

    Reflect.deleteProperty(json, 'case_type_id');
    Reflect.deleteProperty(json, 'custom_fields');

    json = serializeChannelOptions(json, snapshot.attr('channelOptions'));

    if (snapshot.adapterOptions) {
      if (snapshot.adapterOptions.setRequester) {
        json = {requester_id: json.requester_id};
      }
      if (snapshot.adapterOptions.setBrand) {
        json = {brand_id: json.brand_id};
      }
    }
    return json;
  }
});
