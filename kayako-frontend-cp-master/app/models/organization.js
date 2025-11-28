import DS from 'ember-data';
import evented from '@ember/object/evented';
import MF from 'ember-data-model-fragments';
import HasPosts from 'frontend-cp/models/has-posts';
import { computed } from '@ember/object';
import { bool } from '@ember/object/computed';

export default HasPosts.extend(evented, {
  name: DS.attr('string'),
  isShared: DS.attr('boolean'),
  brand: DS.belongsTo('brand', { async: true }),
  pinned: DS.attr('number'),
  customFields: MF.fragmentArray('organization-field-value'),
  fieldValues: MF.fragmentArray('organization-field-value', { defaultValue: [] }),       // write only
  followers: DS.hasMany('user', { async: true, inverse: null }),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),
  domains: DS.hasMany('identity-domain', { async: true }),
  phones: DS.hasMany('identity-phone', { async: true }),
  pinnedNotesCount: DS.attr('number'),
  viewNotes: computed(() => []),

  // Shadow children fields
  notes: DS.hasMany('organization-note', { async: true }),
  tags: DS.hasMany('tag', { async: true }),
  posts: DS.hasMany('post', { async: true }),

  // Indicates whether all fields of a case have been loaded, also see adapter/serializer.
  _isFullyLoaded: DS.attr('boolean', { defaultValue: false }),

  // used in the creation steps
  creationTimestamp: null,

  resourceType: 'organization',

  // CPs
  hasPinnedNotes: bool('pinnedNotesCount')
});
