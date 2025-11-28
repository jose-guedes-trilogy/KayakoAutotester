export default [
  {
    id: 3,
    notification_type: 'case_created',
    channel_desktop: false,
    channel_mobile: false,
    channel_email: false
  },
  {
    id: 4,
    notification_type: 'reply_on_case',
    channel_desktop: true,
    channel_mobile: false,
    channel_email: false
  },
  {
    id: 5,
    notification_type: 'case_assigned_to_agent',
    channel_desktop: true,
    channel_mobile: true,
    channel_email: false
  },
  {
    id: 6,
    notification_type: 'sla_breached',
    channel_desktop: true,
    channel_mobile: true,
    channel_email: false
  },
  {
    id: 7,
    notification_type: 'case_assigned_to_team',
    channel_desktop: true,
    channel_mobile: false,
    channel_email: false
  },
  {
    id: 59,
    notification_type: 'mentioned_in_conversation',
    channel_desktop: false,
    channel_mobile: false,
    channel_email: true
  }
];
