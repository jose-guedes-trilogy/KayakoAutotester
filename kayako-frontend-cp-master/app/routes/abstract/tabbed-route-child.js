import Route from '@ember/routing/route';

export default Route.extend({
  // Actions
  actions: {
    // When a child route of a tabbed route is activated it updates the routeName
    // of the tab to point to it.
    didTransition() {
      this.send('subrouteDidRender', this.routeName);
      return true;
    }
  }
});
