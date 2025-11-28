import Helper from '@ember/component/helper';
import { inject as service } from '@ember/service';
import { getMetaData } from 'frontend-cp/utils/bugsnag';
import { getOwner } from '@ember/application';

export default Helper.extend({
  router: service(),
  eventedRouter: service(),

  init() {
    this._super(...arguments);
    this._fn = () => this.recompute();
    this.get('eventedRouter').on('didTransition', this._fn);
  },

  willDestroy() {
    this.get('eventedRouter').off('didTransition', this._fn);
  },

  compute([routeName, ...models]) {
    if (Array.isArray(routeName)) {
      [routeName, ...models] = routeName;
    }

    let filteredModels = models.filter((model) => {
      if (model.isQueryParams) {
        return false;
      }
      return true;
    });

    try {
      return this.get('router').isActive(routeName, ...filteredModels);
    } catch(e) {
      if (!Ember.testing && window.Bugsnag) {
        let context = getMetaData(null, getOwner(this));
        context['route checked'] = {
          routeName,
          filteredModels
        };
        context.api = undefined;
        window.Bugsnag.notifyException(e, 'Failed to check if route was active', context, 'info');
      }
    }
  }
});
