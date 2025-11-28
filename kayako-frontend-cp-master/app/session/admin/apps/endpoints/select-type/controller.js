import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Controller from '@ember/controller';

export default Controller.extend({
  i18n: service(),
  endpoints: service(),

  _t(key) {
    return this.get('i18n').t(key);
  },

  title: computed(function() {
    let breadcrumbs = [
      this._t('admin.apps.endpoints.title'),
      this._t('admin.apps.endpoints.headings.new')
    ];

    return breadcrumbs.join(' / ');
  }),

  actions: {
    setType(type) {
      this.transitionToRoute('session.admin.apps.endpoints.new', type);
    },

    canceled() {
      this.transitionToRoute('session.admin.apps.endpoints.index');
    }
  }
});
