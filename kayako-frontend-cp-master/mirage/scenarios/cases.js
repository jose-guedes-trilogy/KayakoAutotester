import rel from '../utils/rel';
import { createCustomer } from './users';


export function createCaseWithoutAnyPosts(server, attrs = {}) {
  let createFirstPost = false;
  return createCase(server, attrs, createFirstPost);
}

/**
 * Creates a case with given attrs.
 * @param {Mirage.Server} server
 * @param {Object} attrs
 * @param {string} [attrs.subject='Test Case']
 * @param {string} [attrs.contents='Test message body']
 * @param {User} [attrs.requester=<a-customer>]
 * @param {Brand} [attrs.brand=<a-brand>]
 * @param {Mailbox} [attrs.mailbox=<a-mailbox>]
 * @param {Channel} [attrs.channel=<a-channel>]
 * @param {CaseStatus} [attrs.status=<a-status>]
 * @param {CasePriority} [attrs.priority=<a-priority>]
 * @param {User[]} [attrs.recipients=[]]
 * @param {Attachment[]} [attrs.attachments=[]]
 * @param {Date} [attrs.date=now]
 * @param {CaseFieldValue[]} [attrs.customFields=[]]
 * @param {SlaMetric[]} [attrs.slaMetrics=[]]
 * @param {string} [attrs.postStatus='DELIVERED']
 * @param {string[]} [attrs.viewIds=[]]
 * @returns {Mirage.Model}
 */
export function createCase(server, attrs = {}, createFirstPost = true) {
  let subject = attrs.subject || 'Test Case';
  let contents = attrs.contents || 'Test message body';
  let requester = attrs.requester || createCustomer(server, 'Jo Customer');
  let identity = requester.emails[0];
  let email = identity && identity.email;
  let brand = attrs.brand || server.create('brand');
  let mailbox = attrs.mailbox || server.create('mailbox');
  let channel = attrs.channel || server.create('channel', {
    account: rel(mailbox)
  });
  let status = attrs.status || pickStatus(server);
  let priority = attrs.priority || server.create('case-priority');
  let readMarker = server.create('read-marker');
  let recipients = attrs.recipients || [];
  let attachments = attrs.attachments || [];
  let date = attrs.date || new Date();
  let customFields = attrs.customFields || [];
  let slaMetrics = attrs.slaMetrics || [];
  let postStatus = attrs.postStatus || 'DELIVERED';
  let viewIds = attrs.viewIds || [];
  let message = server.create('case-message', {
    subject,
    body_text: contents,
    body_html: contents,
    recipients,
    fullname: requester.full_name,
    email,
    creator: rel(requester),
    identity: rel(identity),
    mailbox: rel(mailbox),
    attachments,
    download_all: null,
    location: null,
    locale: null,
    response_time: 0,
    created_at: date,
    updated_at: date
  });

  let result;
  let caseAttrs = {
    subject,
    portal: 'API',
    source_channel: rel(channel),
    last_public_channel: rel(channel),
    requester: rel(requester),
    creator: rel(requester),
    identity: rel(identity),
    brand: rel(brand),
    status: rel(status),
    priority: rel(priority),
    read_marker: rel(readMarker),
    sla_version: null,
    sla_metrics: slaMetrics,
    form: null,
    custom_fields: customFields,
    last_replier: rel(requester),
    last_replier_identity: rel(identity),
    last_updated_by: rel(requester),
    last_completed_by: null,
    last_closed_by: null,
    state: 'ACTIVE',
    post_count: 0,
    has_notes: false,
    pinned_notes_count: 0,
    has_attachments: false,
    is_merged: false,
    rating: null,
    rating_status: 'UNOFFERED',
    last_post_status: null,
    last_post_preview: null,
    last_post_type: 'PUBLIC',
    last_message_preview: null,
    realtime_channel: 'presence-123abc@v1_cases_1',
    last_assigned_at: null,
    last_replied_at: date,
    last_opened_at: date,
    last_pending_at: null,
    last_closed_at: null,
    last_completed_at: null,
    last_agent_activity_at: null,
    last_customer_activity_at: date,
    last_reply_by_agent_at: null,
    last_reply_by_requester_at: null,
    agent_updated_at: null,
    latest_assignee_update: null,
    created_at: date,
    updated_at: date,
    _view_ids: viewIds
  };

  if (createFirstPost) {
    let post = server.create('post', {
      subject,
      contents,
      creator: rel(requester),
      identity: rel(identity),
      source_channel: rel(channel),
      attachments,
      download_all: null,
      source: null,
      metadata: {
        user_agent: '',
        page_url: ''
      },
      original: rel(message),
      post_status: postStatus,
      post_status_reject_type: null,
      post_status_reject_reason: null,
      post_status_updated_at: date,
      is_requester: true,
      created_at: date,
      updated_at: date,
    });

    caseAttrs.post_count = 1,
    caseAttrs.last_post_status = postStatus,
    caseAttrs.last_post_preview = post.contents,
    caseAttrs.last_post_type = 'PUBLIC',
    caseAttrs.last_message_preview = post.contents,

    result = server.create('case', caseAttrs);

    server.db.posts.update(result.id, {case_id: result.id});
  } else {
    result = server.create('case', caseAttrs);
  }

  return result;
}

/**
 * Creates a case for the given view id.
 * @param {Mirage.Server} server
 * @param {Object} attrs
 * @param {string} attrs.viewId
 * @param {string} attrs.caseId
 * @param {string} attrs.subject
 * @param {Object[]} attrs.status
 * @param {Object[]} attrs.caseType
 * @param {Object[]} attrs.priority
 * @param {Object[]} attrs.tags
 * @param {Object[]} attrs.slaVersions
 * @param {Object[]} attrs.slaMetrics
 * @param {Object[]} attrs.slaVersionTargets
 * @param {Object} attrs.requester
 * @returns {Mirage.Model}
 */
export function createCaseForView(server, {viewId, caseId, subject, status, caseType, priority, tags, slaVersions, slaMetrics, slaVersionTargets, requester}) {
  return server.create('case', {
    _view_ids: [viewId],
    id: caseId,
    subject: subject,
    status: status,
    type: caseType,
    priority: priority,
    tags: tags,
    sla_metrics: slaMetrics,
    sla_version: slaVersions,
    sla_version_target: slaVersionTargets,
    requester: requester ? { id: requester.id, resource_type: 'user' } : null
  });
}

function pickStatus(server) {
  return server.db.caseStatuses[0] || server.create('case-status');
}
