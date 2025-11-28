import { attr, model } from 'frontend-cp/services/virtual-model';

export default model('endpoint', {
  title: attr(),
  requestMethod: attr(),
  requestContentType: attr(),

  webhookUsername: attr(),
  webhookPassword: attr(),
  webhookUseHttpAuth: attr(),
  webhookAuthMethod: attr(),
  webhookBearerToken: attr(),
  webhookApiKey: attr(),
  webhookApiValue: attr(),
  webhookCustomHeaders: attr(),
  webhookUrl: attr(),
  emailSubject: attr(),
  emailDestination: attr(),
  slackUrl: attr()
});
