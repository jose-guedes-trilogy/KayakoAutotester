import { attr, model } from 'frontend-cp/services/virtual-model';

export default model('twitter-account', {
  screenName: attr(),
  brand: attr(),
  routeMentions: attr(),
  routeMessages: attr(),
  routeFavorites: attr(),
  showInHelpCenter: attr()
});
