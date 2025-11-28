import DS from 'ember-data';

const { Model, attr } = DS;

export default Model.extend({
  title: attr('string', { defaultValue: '' }),
  fieldType: attr('string'),
  isEnabled: attr('boolean', { defaultValue: true }),
  lastAttemptResult: attr('string'),
  lastAttemptMessage: attr('string'),
  lastAttemptAt: attr('date'),

  requestMethod: attr(),
  requestContentType: attr(),

  webhookUrl: attr('string', { defaultValue: '' }),
  webhookUseHttpAuth: attr('string', false),
  webhookUsername: attr('string', { defaultValue: '' }),
  webhookPassword: attr('string', { defaultValue: '' }),
  webhookAuthMethod: attr('string', { defaultValue: 'none' }),
  webhookBearerToken: attr('string', { defaultValue: '' }),
  webhookApiKey: attr('string', { defaultValue: '' }),
  webhookApiValue: attr('string', { defaultValue: '' }),
  webhookCustomHeaders: attr('string', { defaultValue: '' }),
  
  emailDestination: attr('string', { defaultValue: '' }),
  emailSubject: attr('string', { defaultValue: '' }),
  slackUrl: attr('string', { defaultValue: '' })
});
