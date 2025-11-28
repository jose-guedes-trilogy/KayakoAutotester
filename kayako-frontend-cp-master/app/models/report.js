import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo, hasMany } from 'ember-data/relationships';

export default Model.extend({
  label: attr(),
  object: attr({ defaultValue: 'CASES' }),
  visibility: attr({ defaultValue: 'PUBLIC' }),
  visibilityToTeams: hasMany('team', { async: false }),
  predicateCollections: hasMany('predicate-collection', { defaultValue: [], async: false }),
  status: attr(),
  realtimeChannel: attr(),

  creator: belongsTo('user', { async: true, inverse: null }),
  lastGeneratedBy: belongsTo('user', { async: true, inverse: null }),

  recordCount: attr(),
  lastStatusUpdateAt: attr(),
  lastDownloadedAt: attr(),
  activities: attr(), // hasMany [ Activity ]
  createdAt: attr(),
  updatedAt: attr()
});
