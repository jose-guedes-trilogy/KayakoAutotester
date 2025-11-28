// /* eslint-disable new-cap */
//
// import {
//   app,
//   test
// } from 'frontend-cp/tests/helpers/qunit';
//
// app('Acceptance | Macro | Select macro', {
//   beforeEach() {
//     const locale = server.create('locale');
//     const brand = server.create('brand', { locale });
//     const caseFields = server.createList('case-field', 4);
//     const mailbox = server.create('mailbox', { brand });
//     const sourceChannel = server.create('channel', { uuid: 1, account: mailbox });
//     server.create('channel', {
//       uuid: 3,
//       type: 'NOTE'
//     });
//     server.create('case-form', {
//       fields: caseFields,
//       brand: brand
//     });
//     const agentRole = server.create('role', { type: 'AGENT' });
//     const agent = server.create('user', { role: agentRole });
//     const session = server.create('session', { user: agent });
//     const identityEmail = server.create('identity-email');
//     server.createList('case-status', 5);
//     server.createList('case-priority', 4);
//     server.createList('attachment', 3);
//
//     server.create('plan', {
//       limits: [],
//       features: []
//     });
//     const status = server.create('case-status');
//
//     server.create('case', {
//       assignee: server.create('assignee', { agent: null, team: null }),
//       source_channel: sourceChannel,
//       requester: agent,
//       creator: agent,
//       identity: identityEmail,
//       status: status,
//     });
//
//     const macroAssignee = server.create('macro-assignee');
//     const macroVisibility = server.create('macro-visibility');
//
//     server.create('macro', {
//       title: 'Cat 1 \\ Foo',
//       agent: agent,
//       assignee: macroAssignee,
//       visibility: macroVisibility,
//       reply_contents: 'I am Cat 1 / Foo'
//     });
//
//     server.create('macro', {
//       title: 'Cat 1 \\ Bar',
//       agent: agent,
//       assignee: macroAssignee,
//       visibility: macroVisibility,
//       reply_contents: 'I am Cat 1 / Bar'
//     });
//
//     server.create('macro', {
//       title: 'Cat 2 \\ Baz',
//       agent: agent,
//       assignee: macroAssignee,
//       visibility: macroVisibility,
//       reply_contents: 'I am Cat 2 / Baz'
//     });
//
//     login(session.id);
//   },
//
//   afterEach() {
//     logout();
//   }
// });
//
// const triggerSelector = '.ko-case_macro-selector .ember-power-select-trigger';
// const optionSelector = '.ko-case_macro-selector .ember-power-select-option';
// const textAreaSelector = '.ko-text-editor__text-area .ql-editor';
//
// test('Selecting a macro', function(assert) {
//   assert.expect(8);
//   visit('/agent/conversations/1');
//
//   click(triggerSelector);
//
//   andThen(() => {
//     assert.equal(find(optionSelector + ':eq(0)').text().trim(), 'Cat 1', 'Root level should be shown');
//     assert.equal(find(optionSelector + ':eq(1)').text().trim(), 'Cat 2', 'Root level should be shown');
//     assert.equal(find(optionSelector).length, 2, 'Dropdown content should be visible');
//     click(optionSelector + ':eq(0)');
//   });
//
//   andThen(() => {
//     assert.equal(find(optionSelector + ':eq(0)').text().trim(), 'Back', 'Back button should be shown');
//     assert.equal(find(optionSelector + ':eq(1)').text().trim(), 'Cat 1  /  Foo', '1st level should be shown');
//     assert.equal(find(optionSelector + ':eq(2)').text().trim(), 'Cat 1  /  Bar', '1st level should be shown');
//     assert.equal(find(optionSelector).length, 3, 'Dropdown should be nested');
//     click(optionSelector + ':eq(2)');
//   });
//
//   andThen(() => {
//     assert.equal(find(textAreaSelector).text().trim(), 'I am Cat 1 / Bar', 'Selected macro should apply');
//   });
// });
