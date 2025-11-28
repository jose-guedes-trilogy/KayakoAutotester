import { attr, model } from 'frontend-cp/services/virtual-model';

export default model('mailbox', {
  name: attr(),
  locale: attr(),
  domain: attr(),
  subDomain: attr(),
  alias: attr({ nonStrictMatching: true }),
  sslCertificate: attr({ nonStrictMatching: true }),
  privateKey: attr({ nonStrictMatching: true })
});
