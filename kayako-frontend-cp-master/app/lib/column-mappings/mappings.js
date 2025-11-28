export default {
  conversation: {
    fields: [
      'requester.full_name',
      'requester.avatar',
      'requester.locale',
      'requester.presence_channel',
      'requester.pinned_notes_count',
      'requester.organization.pinned_notes_count',
      'subject',
      'last_replied_at',
      'last_message_preview',
      'last_post_status',
      'last_replier.role',
      'realtime_channel',
      'read_marker',
      'has_attachments',
      'pinned_notes_count'
    ],
    includes: [
      'user',
      'organization',
      'role',
      'read_marker'
    ]
  },

  assigneeagentid: {
    fields: [
      'assigned_agent.full_name',
      'assigned_agent.avatar',
      'assigned_agent.locale'
    ],
    includes: ['user']
  },

  assigneeteamid: {
    fields: [
      'assigned_team.title'
    ],
    includes: ['team']
  },

  brandid: {
    fields: [
      'brand.name'
    ],
    includes: ['brand']
  },

  casepriorityid: {
    fields: [
      'priority.label'
    ],
    includes: ['case_priority']
  },

  casestatusid: {
    fields: [
      'status.label',
      'status.type'
    ],
    includes: ['case_status']
  },

  casetypeid: {
    fields: [
      'type.label'
    ],
    includes: ['case_type']
  },

  channel: {
    fields: [
      'source_channel' //Need to return the full source_channel due to API bug https://kayako.atlassian.net/browse/PDM-9665
    ],
    includes: ['channel']
  },

  createdat: {
    fields: ['created_at'],
    includes: []
  },

  lastagentrepliedat: {
    fields: ['last_reply_by_agent_at'],
    includes: []
  },

  lastcompletedat: {
    fields: ['last_completed_at'],
    includes: []
  },

  lastrepliedat: {
    fields: ['last_replied_at'],
    includes: []
  },

  lastrequesterrepliedat: {
    fields: ['last_reply_by_requester_at'],
    includes: []
  },

  latestassigneeupdate: {
    fields: ['latest_assignee_update'],
    includes: []
  },

  latestagentupdate: {
    fields: ['last_agent_activity_at'],
    includes: []
  },

  lastupdatedby: {
    fields: [
      'last_updated_by.full_name'
    ],
    includes: ['user']
  },

  organizationid: {
    fields: [
      'requester.organization.name',
      'organization.name'
    ],
    includes: [
      'user',
      'organization'
    ]
  },

  rating: {
    fields: ['rating'],
    includes: []
  },

  requesterid: {
    fields: [
      'requester.full_name',
      'requester.avatar',
      'requester.locale',
      'requester.presence_channel'
    ],
    includes: ['user']
  },

  satisfactionstatus: {
    fields: ['rating_status'],
    includes: []
  },

  slafirstreplytime: {
    fields: [
      'sla_metrics.metric_type',
      'sla_metrics.stage',
      'sla_metrics.due_at',
      'sla_metrics.completed_at',
      'sla_metrics.last_paused_at',
      'sla_metrics.target.operational_hours'
    ],
    includes: [
      'sla_metric',
      'sla_version_target'
    ]
  },

  slanextbreach: {
    fields: [
      'sla_metrics.metric_type',
      'sla_metrics.stage',
      'sla_metrics.due_at',
      'sla_metrics.completed_at',
      'sla_metrics.last_paused_at',
      'sla_metrics.target.operational_hours'
    ],
    includes: [
      'sla_metric',
      'sla_version_target'
    ]
  },

  slanextreplytime: {
    fields: [
      'sla_metrics.metric_type',
      'sla_metrics.stage',
      'sla_metrics.due_at',
      'sla_metrics.completed_at',
      'sla_metrics.last_paused_at',
      'sla_metrics.target.operational_hours'
    ],
    includes: [
      'sla_metric',
      'sla_version_target'
    ]
  },

  slaresolutiontime: {
    fields: [
      'sla_metrics.metric_type',
      'sla_metrics.stage',
      'sla_metrics.due_at',
      'sla_metrics.completed_at',
      'sla_metrics.last_paused_at',
      'sla_metrics.target.operational_hours'
    ],
    includes: [
      'sla_metric',
      'sla_version_target'
    ]
  },

  slaversionid: {
    fields: [
      'sla_version.title'
    ],
    includes: ['sla_version']
  },

  updatedat: {
    fields: ['updated_at'],
    includes: []
  }
};
