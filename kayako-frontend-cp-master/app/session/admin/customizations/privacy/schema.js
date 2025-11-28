import { attr, model } from 'frontend-cp/services/virtual-model';

export default model('privacy', {
  url: attr(),
  privacyType: attr(),
  locale: attr(),
  default: attr(),
});
