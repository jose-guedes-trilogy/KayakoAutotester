import Service, { inject as service } from '@ember/service';
import { getOwner } from '@ember/application';

export default Service.extend({
  notification: service('notification'),
  i18n: service(),

  init() {
    this._super(...arguments);
    this.records = [];
  },

  accept(record) {
    this.records.push(record);
  },

  process() {
    const i18n = this.get('i18n');
    const router = getOwner(this).lookup('router:main');
    const recordsCount = this.records.length;
    const extendLicenseRoute = 'session.admin.account.plans';

    if (recordsCount) {
      this.get('notification').add({
        type: 'error',
        title: i18n.t('generic.license_expired'),
        autodismiss: false,
        dismissable: true,
        href: Reflect.apply(router.generate, router, [extendLicenseRoute]),
        hrefTarget: '_self',
        hrefText: i18n.t('generic.license_expired_href'),
        onClose: () => {
          router.transitionTo(extendLicenseRoute);
        }
      });

      this.records = [];
    }

    return recordsCount;
  }
});
