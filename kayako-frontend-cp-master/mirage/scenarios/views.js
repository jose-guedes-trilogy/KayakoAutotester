export function createInbox(server) {
  return server.create('view', {
    id: 1,
    title: 'Inbox',
    type: 'INBOX',
    visibility_type: 'ALL',
    visibility_to_teams: [],
    order_by_column: 'updatedat',
    order_by: 'DESC',
    is_default: true,
    is_system: true,
    is_enabled: true,
  });
}
