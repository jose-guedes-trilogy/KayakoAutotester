import DS from 'ember-data';
import ApplicationSerializer from './application';

export default ApplicationSerializer.extend(DS.EmbeddedRecordsMixin, {
  attrs: {
    updatedAt: { serialize: false },
    createdAt: { serialize: false },
    recordCount: { serialize: false },
    lastStatusUpdateAt: { serialize: false },
    lastDownloadedAt: { serialize: false },
    activities: { serialize: false },
    lastGeneratedBy: { serialize: false },
    creator: { serialize: false },
    status: { serialize: false },
    predicateCollections: { serialize: 'records' }
  },

  serializeHasMany(snapshot, json, relationship) {
    if (relationship.key === 'visibilityToTeams') {
      if (snapshot.attr('visibility') !== 'TEAM') { return; }
      json.team_ids = snapshot.hasMany('visibilityToTeams').mapBy('id');
    } else {
      this._super(...arguments);
    }
  }

});
