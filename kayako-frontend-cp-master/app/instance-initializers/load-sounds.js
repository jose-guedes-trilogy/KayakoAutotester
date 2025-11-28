export function initialize(appInstance) {
  let soundAlerts = appInstance.lookup('service:sound-alerts');
  soundAlerts.initializeSounds();
}

export default {
  name: 'load-sounds',
  initialize
};
