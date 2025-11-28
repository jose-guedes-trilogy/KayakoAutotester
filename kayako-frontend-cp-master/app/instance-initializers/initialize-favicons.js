export function initialize(appInstance) {
  let service = appInstance.lookup('service:browser-tab');
  service.initialize();
}

export default {
  name: 'initialize-favicons',
  initialize
};
