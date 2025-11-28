import DS from 'ember-data';
import MF from 'ember-data-model-fragments';
import HasPosts from 'frontend-cp/models/has-posts';
import { computed } from '@ember/object';
import { bool, reads, or, not } from '@ember/object/computed';

export default HasPosts.extend({
  assignedTeam: DS.belongsTo('team', { async: true }),
  assignedAgent: DS.belongsTo('user', { async: true, inverse: null }),
  subject: DS.attr('string', { defaultValue: '' }),
  portal: DS.attr('string'),
  sourceChannel: DS.belongsTo('channel', { async: true }),
  lastPublicChannel: DS.belongsTo('channel', { async: true }),
  requester: DS.belongsTo('user', { async: true, inverse: null }),
  creator: DS.belongsTo('user', { async: true, inverse: null }),
  identity: DS.belongsTo('identity', { polymorphic: true, async: true }),
  slaVersion: DS.belongsTo('sla-version', { async: true }),
  slaMetrics: DS.hasMany('sla-metric', { async: true }),
  lastAssignedBy: DS.belongsTo('user', { async: true }),
  brand: DS.belongsTo('brand', { async: true }),
  status: DS.belongsTo('case-status', { async: true }),
  priority: DS.belongsTo('case-priority', { async: true }),
  caseType: DS.belongsTo('case-type', { async: true }),
  form: DS.belongsTo('case-form', { async: true }),
  readMarker: DS.belongsTo('read-marker', { async: true }),
  customFields: MF.fragmentArray('case-field-value', {defaultValue: []}),
  // metadata // TODO nested json
  lastReplier: DS.belongsTo('user', { async: true, inverse: null }),
  lastUpdatedBy: DS.belongsTo('user', { async: true, inverse: null }),
  lastReplierIdentity: DS.belongsTo('identity', { async: true }),
  organization: DS.belongsTo('organization', { async: true }),
  creationMode: DS.attr('string'),
  state: DS.attr('string'),
  hasNotes: DS.attr('boolean'),
  pinnedNotesCount: DS.attr('number'),
  viewNotes: computed(() => []),
  hasAttachments: DS.attr('boolean'),
  rating: DS.attr('string'),
  ratingStatus: DS.attr('string'),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),
  lastAgentActivityAt: DS.attr('date'),
  lastReplyByAgentAt: DS.attr('date'),
  lastRepliedAt: DS.attr('date'),
  lastReplyByRequesterAt: DS.attr('date'),
  lastCustomerActivityAt: DS.attr('date'),
  lastCompletedAt: DS.attr('date'),
  latestAssigneeUpdate: DS.attr('date'),
  realtimeChannel: DS.attr('string'),
  attachmentFileIds: DS.attr('string'),
  lastMessagePreview: DS.attr('string'),
  lastPostStatus: DS.attr('string'),

  // Children fields
  messages: DS.hasMany('case-message', { async: true }),
  posts: DS.hasMany('post', { async: true }),
  activities: DS.hasMany('activity', { async: true }),
  replyChannels: DS.hasMany('channel', { async: true }),
  reply: DS.hasMany('case-reply', { async: true }),
  channelOptions: MF.fragment('case-reply-options'),
  tags: DS.hasMany('tag', { async: true }),

  // Parent field
  view: DS.belongsTo('view', { async: true }),

  // Creation Fields
  contents: DS.attr('string'),
  channel: DS.attr('string'),
  channelId: DS.attr('string'),

  // used in the creation steps
  creationTimestamp: null,

  // Indicates whether all fields of a case have been loaded, also see adapter/serializer.
  _isFullyLoaded: DS.attr('boolean', { defaultValue: false }),

  resourceType: 'case',

  // CPs
  hasPinnedNotes: bool('pinnedNotesCount'),

  // models/user needs recentCases.@each.status.statusType, but can't go 2 levels deep after an @each
  // so alias statusType here
  statusType: reads('status.statusType'),

  canReload: not('cannotReload'),
  cannotReload: or('isLoading', 'isReloading', 'isSaving')
});
