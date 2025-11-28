import { attr, many, model } from 'frontend-cp/services/virtual-model';

export default model('oauth-app', {
  name: attr(),
  url: attr(),
  description: attr(),
  scopes: many(attr()),
  author: attr(),
  author_url: attr(),
  callback_url: attr(),

  logoFileId: attr()
});
