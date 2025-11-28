import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  subject: i => `ERS Audit ${i + 1}`,
  mask_id: i => `DXX-${i + 1}-${faker.random.number()}`,
  portal: null,
  source_channel: null,
  requester: null,
  creator: null,
  identity: null,
  brand: null,
  status: null,
  priority: null,
  type: null,
  sla_version: null,
  metadata: null,
  last_replier: null,
  last_replier_identity: null,
  creation_mode: 'WEB',
  state: 'ACTIVE',
  post_count: 3,
  tags: () => [],
  has_notes: false,
  pinned_notes_count: 0,
  has_attachments: false,
  rating: null,
  rating_status: 'UNOFFERED',
  _view_ids: () => [],
  created_at: '2015-07-09T15:36:10Z',
  updated_at: '2015-07-09T15:36:10Z',
  last_agent_activity_at: null,
  last_assigned_at: null,
  last_closed_at: null,
  last_opened_at: null,
  last_pending_at: null,
  last_customer_activity_at: '2015-07-09T15:36:10Z',
  realtime_channel: i => `kre-case-${i + 1}`,
  resource_type: 'case',
  resource_url: null,

  afterCreate(record, server) {
    server.db.cases.update(record.id, {
      resource_url: '/api/v1/cases/' + record.id
    });
  }
});
