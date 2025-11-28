import { attr, many, model } from 'frontend-cp/services/virtual-model';

export default model('report', {
  label: attr(),
  visibility: attr(),
  visibilityToTeams: many(attr()),
  predicateCollections: many(model('predicate-collection', {
    id: attr(),
    propositions: many(model('proposition', {
      id: attr(),
      field: attr(),
      operator: attr(),
      value: attr()
    }))
  }))
});
