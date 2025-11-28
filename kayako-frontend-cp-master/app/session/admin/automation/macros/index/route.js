import Route from '@ember/routing/route';

export const MACROS_LIMIT = 50;

export default Route.extend({
  queryParams: {
    page: { refreshModel: true }
  },

  model({ page }) {
    let offset = (parseInt(page) - 1) * MACROS_LIMIT;
    return this.get('store').query('macro', { show_all: true, offset, limit: MACROS_LIMIT });
  },

  actions: {
    willTransition(transition) {
      if (transition.queryParamsOnly) {
        this.controller.set('isLoadingMacros', true);
      }
    },

    didTransition() {
      this.controller.set('isLoadingMacros', false);
    }
  }
});
