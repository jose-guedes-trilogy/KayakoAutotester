import { attr, model, list } from 'frontend-cp/services/virtual-model';

export default model('macro', {
  id: attr(),
  title: attr(),
  visibilityType: attr(),
  replyType: attr(),
  replyContents: attr(),
  assigneeType: attr(),
  priorityAction: attr(),
  addTags: list(),
  removeTags: list(),

  visibleToTeam: attr(),
  assignedTeam: attr(),
  assignedAgent: attr(),
  priority: attr(),
  status: attr(),
  agent: attr(),
  caseType: attr(),

  isEnabled: attr(),
  createdAt: attr(),
  updatedAt: attr(),

  actions: attr()
});
