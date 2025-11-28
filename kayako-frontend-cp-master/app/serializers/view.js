import DS from 'ember-data';
import ApplicationSerializer from './application';

export default ApplicationSerializer.extend(DS.EmbeddedRecordsMixin, {
  attrs: {
    updatedAt: { serialize: false },
    createdAt: { serialize: false },
    columns: { serialize: 'ids', deserialize: 'records' },
    predicateCollections: { serialize: 'records' }
  },

  serializeHasMany(snapshot, json, relationship) {
    if (relationship.key === 'visibilityToTeams') {
      if (snapshot.attr('visibilityType') !== 'TEAM') { return; }
      json.team_ids = snapshot.hasMany('visibilityToTeams').mapBy('id');
    } else {
      this._super(...arguments);
    }
  }
});
