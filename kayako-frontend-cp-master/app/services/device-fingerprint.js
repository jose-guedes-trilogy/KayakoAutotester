import Service from '@ember/service';
import uuid from 'npm:uuid';
import { inject as service } from '@ember/service';

const NAMESPACE = 'device';
const KEY = 'fingerprint';

export default Service.extend({
  localStore: service(),

  create() {
    const fingerprint = uuid.v4();
    this.get('localStore').setItem(NAMESPACE, KEY, fingerprint, { persist: true });
    return fingerprint;
  },

  fetch() {
    return this.get('localStore').getItem(NAMESPACE, KEY, { persist: true });
  },

  exists() {
    return Boolean(this.fetch());
  },

  getOrCreate() {
    return this.fetch() || this.create();
  }
});
