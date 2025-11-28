import Service from '@ember/service';
import { inject as service } from '@ember/service';

export default Service.extend({
  // Static
  slaMetricsInSeconds: false,

  // Services
  serverClock: service(),

  showSlaMetricsInSeconds() {
    this.set('slaMetricsInSeconds', true);
    this.get('serverClock').restartRunningTick();
  }
});
