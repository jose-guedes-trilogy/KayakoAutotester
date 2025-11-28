import DS from 'ember-data';
import MF from 'ember-data-model-fragments';
import HasPosts from 'frontend-cp/models/has-posts';
import { computed } from '@ember/object';

export default HasPosts.extend({
  uuid: DS.attr('string'),
  fullName: DS.attr('string'),
  designation: DS.attr('string'),
  alias: DS.attr('string'),
  isEnabled: DS.attr('boolean'),
  isMfaEnabled: DS.attr('boolean'),
  role: DS.belongsTo('role', { async: false }),
  avatar: DS.attr('string'),
  organization: DS.belongsTo('organization', { async: true }),
  teams: DS.hasMany('team', { async: false }),
  customFields: MF.fragmentArray('user-field-value', { defaultValue: [] }),
  fieldValues: MF.fragmentArray('user-field-value', { defaultValue: [] }),       // write only
  locale: DS.belongsTo('locale', { async: true }),
  timeZone: DS.attr('string'),
  timeZoneOffset: DS.attr('number'),
  greeting: DS.attr('string'),
  signature: DS.attr('string'),
  statusMessage: DS.attr('string'),
  passwordUpdateAt: DS.attr('date'),
  avatarUpdateAt: DS.attr('date'),
  activityAt: DS.attr('date'),
  visitedAt: DS.attr('date'),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),
  lastActiveAt: DS.attr('date'),
  lastSeenAt: DS.attr('date'),
  lastActivityAt: DS.attr('date'),
  lastLoggedInAt: DS.attr('date'),
  pinnedNotesCount: DS.attr('number'),
  viewNotes: computed(() => []),

  presenceChannel: DS.attr('string'),
  notificationChannel: DS.attr('string'),

  agentCaseAccess: DS.attr('string', { defaultValue: 'ALL' }),
  organizationCaseAccess: DS.attr('string', { defaultValue: 'REQUESTED' }),

  // returned if we hit the /users/me endpoint
  permissions: DS.hasMany('permission'),

  // Shadow children fields
  accesslogs: DS.hasMany('access-log', { async: true }),
  recentCases: DS.hasMany('case', { async: true, inverse: 'requester' }),
  activeCases: computed('recentCases.@each.statusType', function () {
    const closedTypes = ['COMPLETED', 'CLOSED'];
    return this.get('recentCases').filter((_case) => {
      return !closedTypes.includes(_case.get('status.statusType'));
    });
  }),
  tags: DS.hasMany('tag', { async: true }),
  notes: DS.hasMany('user-note', { async: true }),

  emails: DS.hasMany('identity-email', { async: false }),
  phones: DS.hasMany('identity-phone', { async: false }),
  twitter: DS.hasMany('identity-twitter', { async: false }),
  facebook: DS.hasMany('identity-facebook', { async: false }),

  resourceType: 'user',

  save() {
    this.get('customFields').forEach(customField => {
      this.get('fieldValues').createFragment({
        fieldId: customField.get('field.id'),
        value: (customField.get('value') === '' ? null : customField.get('value'))
      });
    });

    return this._super(...arguments);
  },

  primaryEmail: computed('emails.@each.isPrimary', function() {
    let emails = this.get('emails');
    let primaryEmail = emails.filter((email) => {
      return email.get('isPrimary');
    }).get('firstObject');

    return primaryEmail ? primaryEmail : emails.get('firstObject');
  }),

  primaryEmailAddress: computed('primaryEmail', function() {
    return this.get('primaryEmail.email');
  }),

  primaryPhoneIdentity: computed('phones.@each.isPrimary', function() {
    return this.get('phones').filter(phone => phone.get('isPrimary')).get('firstObject');
  }),
  primaryPhoneNumber: computed.readOnly('primaryPhoneIdentity.number'),

  primaryTwitterIdentity: computed('twitter.@each.isPrimary', function() {
    return this.get('twitter').filter(twitter => twitter.get('isPrimary')).get('firstObject');
  }),
  primaryTwitterHandle: computed.readOnly('primaryTwitterIdentity.screenName'),

  primaryFacebookIdentity: computed('facebook.@each.isPrimary', function() {
    return this.get('facebook').filter(facebook => facebook.get('isPrimary')).get('firstObject');
  }),
  primaryFacebookUsername: computed.readOnly('primaryFacebookIdentity.screenName'),

  // Indicates whether all fields of a case have been loaded, also see adapter/serializer.
  _isFullyLoaded: DS.attr('boolean', { defaultValue: false }),

  // used in the creation steps
  creationTimestamp: null,

  hasPinnedNotes: computed.bool('pinnedNotesCount')
});
