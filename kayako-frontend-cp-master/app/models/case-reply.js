import DS from 'ember-data';
import uuid from 'npm:uuid/v4';
import MF from 'ember-data-model-fragments';

export default DS.Model.extend({
  clientId: DS.attr('string', {
    defaultValue() {
      return uuid();
    }
  }),
  contents: DS.attr('string'),
  channelType: DS.attr('string'),
  channel: DS.belongsTo('account', { async: false }),
  inReplyToUuid: DS.attr('string'),
  channelOptions: MF.fragment('case-reply-options'),
  status: DS.belongsTo('case-status', { async: false }),
  priority: DS.belongsTo('case-priority', { async: false }),
  caseType: DS.belongsTo('case-type', { async: false }),
  assignedTeam: DS.belongsTo('team', { async: false }),
  assignedAgent: DS.belongsTo('user', { async: false }),
  tags: DS.attr('string'),
  fieldValues: MF.fragmentArray('case-field-value'),
  requester: DS.belongsTo('user', { async: false, inverse: null }),
  subject: DS.attr('string', { defaultValue: '' }),
  // _filename: DS.belongsTo('?'),

  form: DS.belongsTo('case-form', { async: false }),

  attachmentFileIds: DS.attr('string'),

  case: DS.belongsTo('case', { async: true }),
  posts: DS.hasMany('post', { async: true })
});
