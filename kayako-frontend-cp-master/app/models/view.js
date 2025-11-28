import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import DS from 'ember-data';

export default DS.Model.extend({
  // Attributes
  title: DS.attr('string', { defaultValue: '' }),
  visibilityType: DS.attr('string'),                          // ALL | TEAM
  orderByColumn: DS.attr('string', { defaultValue: 'updatedat' }),
  orderBy: DS.attr('string', { defaultValue: 'ASC' }),
  sortOrder: DS.attr('number'),
  isEnabled: DS.attr('boolean', { defaultValue: true }),
  isDefault: DS.attr('boolean', { defaultValue: false }),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),
  viewType: DS.attr('string'),

  // Relations
  agent: DS.belongsTo('user', { async: false }),
  visibilityToTeams: DS.hasMany('team', { async: false }),
  columns: DS.hasMany('column', { async: false }),
  predicateCollections: DS.hasMany('predicate-collection', { defaultValue: [], async: false }),
  viewCount: DS.belongsTo('view-count', { async: true }),
  cases: DS.hasMany('case', { async: true }),

  // Services
  i18n: service(),

  // CPs
  visibilityString: computed('visibilityType', 'visibilityToTeams', function() {
    const trans = `admin.views.sharing.${this.get('visibilityType')}`;

    if (this.get('visibilityType') === 'TEAM') {
      return this.get('visibilityToTeams').map(team => team.get('title')).join(', ');
    }

    return this.get('i18n').t(trans);
  })
});
