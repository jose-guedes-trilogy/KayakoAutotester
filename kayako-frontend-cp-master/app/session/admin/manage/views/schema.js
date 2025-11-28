import { attr, many, model } from 'frontend-cp/services/virtual-model';

export default model('view', {
  title: attr(),
  isEnabled: attr(),
  visibilityType: attr(),
  visibilityToTeams: many(attr()),
  predicateCollections: many(model('predicate-collection', {
    id: attr(),
    propositions: many(model('proposition', {
      id: attr(),
      field: attr(),
      operator: attr(),
      value: attr()
    }))
  })),
  columns: many(attr()),
  orderByColumn: attr(),
  orderBy: attr()
});
