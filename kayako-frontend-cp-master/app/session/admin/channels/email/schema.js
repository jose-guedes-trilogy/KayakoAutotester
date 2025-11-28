import { attr, model } from 'frontend-cp/services/virtual-model';

export default model('mailbox', {
  address: attr(),
  brand: attr()
});
