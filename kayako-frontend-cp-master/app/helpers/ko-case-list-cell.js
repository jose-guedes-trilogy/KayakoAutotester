import Helper from '@ember/component/helper';
import { dasherize } from '@ember/string';

export default Helper.helper(([kind, column]) => {
  switch (kind) {
    case 'componentName':
      return columnComponentName(column);
    case 'propertyName':
      return columnPropertyName(column);
  }
});

const CUSTOM_TYPE_COLUMNS = [
  'userAvatar',
  'organizationAvatar',
  'conversation',
  'channel',
  'slafirstreplytime',
  'slaresolutiontime',
  'slanextreplytime',
  'slanextbreach',
  'casestatusid',
  'userComposite',
  'orgComposite',
  'convComposite'
];

const STRING_COLUMNS = {
  assigneeteamid: 'assignedTeam.title',
  brandid: 'brand.name',
  caseid: 'id',
  casepriorityid: 'priority.label',
  casetypeid: 'caseType.label',
  lastupdatedby: 'lastUpdatedBy.fullName',
  rating: 'rating',
  satisfactionstatus: 'ratingStatus',
  slaversionid: 'slaVersion.title',
  fullname: 'fullName',
  email: 'primaryEmail.email',
  organizationName: 'organization.name',
  id: 'id',
  name: 'name'
};

const USER_COLUMNS = {
  assigneeagentid: 'assignedAgent',
  requesterid: 'requester'
};

const COMPOSITE_COLUMNS = {
  userComposite: 'user',
  orgComposite: 'organization'
};

const DATE_COLUMNS = {
  createdat: 'createdAt',
  lastagentrepliedat: 'lastReplyByAgentAt',
  lastcompletedat: 'lastCompletedAt',
  lastrepliedat: 'lastRepliedAt',
  lastrequesterrepliedat: 'lastReplyByRequesterAt',
  latestassigneeupdate: 'latestAssigneeUpdate',
  latestagentupdate: 'lastAgentActivityAt',    // last_agent_activity_at || agent_updated_at
  updatedat: 'updatedAt',
  lastseenat: 'lastSeenAt',
  lastActivityAt: 'lastActivityAt'
};

function columnComponentName(column) {
  if (column === 'organizationid') {
    return 'ko-cases-list/column/case-organization';
  } else if (DATE_COLUMNS[column]) {
    return 'ko-cases-list/column/generic-date';
  } else if (STRING_COLUMNS[column]) {
    return 'ko-cases-list/column/generic-string';
  } else if (USER_COLUMNS[column]) {
    return 'ko-cases-list/column/user';
  } else if (column.indexOf('case_field') === 0) {
    return 'ko-cases-list/column/custom-field';
  } else if (CUSTOM_TYPE_COLUMNS.indexOf(column) !== -1) {
    return `ko-cases-list/column/${dasherize(column)}`;
  }
}

function columnPropertyName(column) {
  return STRING_COLUMNS[column] || DATE_COLUMNS[column] || USER_COLUMNS[column] || COMPOSITE_COLUMNS[column];
}
