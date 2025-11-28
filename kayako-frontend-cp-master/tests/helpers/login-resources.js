export default function setupDataForCasesView() {
  const locale = server.create('locale', { locale: 'en-us' });
  const brand = server.create('brand', { locale });
  const caseFields = server.createList('case-field', 4);
  const mailbox = server.create('mailbox', { brand, is_default: true });
  server.create('channel', { account: { id: mailbox.id, resource_type: 'mailbox' } });
  server.create('case-form', {
    fields: caseFields,
    brand: brand
  });
  const agentRole = server.create('role', { type: 'AGENT' });
  const customerRole = server.create('role', { type: 'AGENT' });

  server.create('user', { role: agentRole, locale: locale, time_zone: 'Europe/London' });

  server.create('user', { full_name: 'Barney Stinson', role: customerRole, locale: locale, time_zone: 'Europe/London' });
  server.createList('case-status', 5);
  server.createList('case-priority', 4);

  server.create('plan', {
    limits: {},
    features: [],
    account_id: '123',
    subscription_id: '123'
  });

  const columns = server.createList('column', 5);

  const propositionAssignedToCurrentUser = server.create('proposition', {
    field: 'cases.assigneeagentid',
    operator: 'comparison_equalto',
    value: '(current_user)'
  });

  const inboxPredicateCollection = server.create('predicate-collection', {
    propositions: [{ id: propositionAssignedToCurrentUser.id, resource_type: 'proposition' }]
  });

  server.create('view', {
    title: 'Inbox',
    is_default: true,
    is_enabled: true,
    is_system: true,
    order_by: 'DESC',
    order_by_column: 'caseid',
    columns: columns,
    predicate_collections: [{ id: inboxPredicateCollection.id, resource_type: 'predicate_collection' }],
    sort_order: 1,
    type: 'INBOX'
  });
}
