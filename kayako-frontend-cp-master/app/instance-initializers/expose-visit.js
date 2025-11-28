export function initialize(appInstance) {
  window.kayakoVisit = url => appInstance.visit(url);
}

export default {
  name: 'expose-visit',
  initialize
};
