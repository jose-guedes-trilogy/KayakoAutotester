import mapToFieldsAndIncludes from 'frontend-cp/lib/column-mappings/map-columns-to-fields-and-includes';
import { module, test } from 'qunit';

module('Unit | Lib | map columns to fields and includes');

test('conversation column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['conversation']);

  assert.equal(fields, [
    'requester(full_name,avatar,locale,presence_channel,pinned_notes_count,organization(pinned_notes_count))',
    'subject',
    'last_replied_at',
    'last_message_preview',
    'last_post_status',
    'last_replier(role)',
    'realtime_channel',
    'read_marker',
    'has_attachments',
    'pinned_notes_count'
  ].join(',')
  );
  assert.equal(includes, 'user,organization,role,read_marker');
});

test('assignee user column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['assigneeagentid']);

  assert.equal(fields, [
    'assigned_agent(full_name,avatar,locale)'
  ].join(',')
  );
  assert.equal(includes, 'user');
});

test('assignee team column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['assigneeteamid']);

  assert.equal(fields, [
    'assigned_team(title)'
  ].join(',')
  );
  assert.equal(includes, 'team');
});

test('brand column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['brandid']);

  assert.equal(fields, [
    'brand(name)'
  ].join(',')
  );
  assert.equal(includes, 'brand');
});

test('priority column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['casepriorityid']);

  assert.equal(fields, [
    'priority(label)'
  ].join(',')
  );
  assert.equal(includes, 'case_priority');
});

test('status column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['casestatusid']);

  assert.equal(fields, [
    'status(label,type)'
  ].join(',')
  );
  assert.equal(includes, 'case_status');
});

test('case type column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['casetypeid']);

  assert.equal(fields, [
    'type(label)'
  ].join(',')
  );
  assert.equal(includes, 'case_type');
});

test('source channel column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['channel']);

  assert.equal(fields, [
    'source_channel'
  ].join(',')
  );
  assert.equal(includes, 'channel');
});

test('created at column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['createdat']);

  assert.equal(fields, [
    'created_at'
  ].join(',')
  );
  assert.equal(includes, '');
});

test('last agent replied at column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['lastagentrepliedat']);

  assert.equal(fields, [
    'last_reply_by_agent_at'
  ].join(',')
  );
  assert.equal(includes, '');
});

test('last completed at column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['lastcompletedat']);

  assert.equal(fields, [
    'last_completed_at'
  ].join(',')
  );
  assert.equal(includes, '');
});

test('last replied at column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['lastrepliedat']);

  assert.equal(fields, [
    'last_replied_at'
  ].join(',')
  );
  assert.equal(includes, '');
});

test('last requester replied at column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['lastrequesterrepliedat']);

  assert.equal(fields, [
    'last_reply_by_requester_at'
  ].join(',')
  );
  assert.equal(includes, '');
});

test('last assignee updated at column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['latestassigneeupdate']);

  assert.equal(fields, [
    'latest_assignee_update'
  ].join(',')
  );
  assert.equal(includes, '');
});

test('last agent updated at column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['latestagentupdate']);

  assert.equal(fields, [
    'last_agent_activity_at'
  ].join(',')
  );
  assert.equal(includes, '');
});

test('last updated by column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['lastupdatedby']);

  assert.equal(fields, [
    'last_updated_by(full_name)'
  ].join(',')
  );
  assert.equal(includes, 'user');
});

test('organization column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['organizationid']);

  assert.equal(fields, [
    'requester(organization(name))'
  ].join(',')
  );
  assert.equal(includes, 'user,organization');
});

test('rating column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['rating']);

  assert.equal(fields, [
    'rating'
  ].join(',')
  );
  assert.equal(includes, '');
});

test('requester column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['requesterid']);

  assert.equal(fields, [
    'requester(full_name,avatar,locale,presence_channel)'
  ].join(',')
  );
  assert.equal(includes, 'user');
});

test('satisfaction status column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['satisfactionstatus']);

  assert.equal(fields, [
    'rating_status'
  ].join(',')
  );
  assert.equal(includes, '');
});

test('first reply time sla column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['slafirstreplytime']);

  assert.equal(fields, [
    'sla_metrics(metric_type,stage,due_at,completed_at,last_paused_at,target(operational_hours))'
  ].join(',')
  );
  assert.equal(includes, 'sla_metric,sla_version_target');
});

test('next breach sla column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['slanextbreach']);

  assert.equal(fields, [
    'sla_metrics(metric_type,stage,due_at,completed_at,last_paused_at,target(operational_hours))'
  ].join(',')
  );
  assert.equal(includes, 'sla_metric,sla_version_target');
});

test('next reply sla column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['slanextreplytime']);

  assert.equal(fields, [
    'sla_metrics(metric_type,stage,due_at,completed_at,last_paused_at,target(operational_hours))'
  ].join(',')
  );
  assert.equal(includes, 'sla_metric,sla_version_target');
});

test('resolution time sla column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['slaresolutiontime']);

  assert.equal(fields, [
    'sla_metrics(metric_type,stage,due_at,completed_at,last_paused_at,target(operational_hours))'
  ].join(',')
  );
  assert.equal(includes, 'sla_metric,sla_version_target');
});

test('sla version column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['slaversionid']);

  assert.equal(fields, [
    'sla_version(title)'
  ].join(',')
  );
  assert.equal(includes, 'sla_version');
});

test('updated at column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['updatedat']);

  assert.equal(fields, [
    'updated_at'
  ].join(',')
  );
  assert.equal(includes, '');
});

test('custom field column column', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes(['case_field_cheese']);

  assert.equal(fields, [
    'custom_fields'
  ].join(',')
  );
  assert.equal(includes, '');
});

test('multiple columns with common fields doesn\'t duplicate fields or includes', function(assert) {
  assert.expect(2);

  let { fields, includes } = mapToFieldsAndIncludes([
    'conversation',
    'assigneeagentid',
    'requesterid',
    'slafirstreplytime',
    'slanextbreach',
    'organizationid',
    'case_field_cheese'
  ]);

  assert.equal(fields, [
    'requester(full_name,avatar,locale,presence_channel,pinned_notes_count,organization(pinned_notes_count,name))',
    'subject',
    'last_replied_at',
    'last_message_preview',
    'last_post_status',
    'last_replier(role)',
    'realtime_channel',
    'read_marker',
    'has_attachments',
    'pinned_notes_count',
    'assigned_agent(full_name,avatar,locale)',
    'sla_metrics(metric_type,stage,due_at,completed_at,last_paused_at,target(operational_hours))',
    'custom_fields'
  ].join(',')
  );
  assert.equal(includes, 'user,organization,role,read_marker,sla_metric,sla_version_target');
});
