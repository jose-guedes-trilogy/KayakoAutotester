import ApplicationAdapter from './application';
import UnpaginateMixin from './unpanginate-mixin';

export default ApplicationAdapter.extend(UnpaginateMixin, {
  getSslCertificates(brand) {
    let brandId = brand.get('id');
    let url = `${this.namespace}/brands/${brandId}/certificate`;

    return this.ajax(url, 'GET');
  },

  buildURL() {
    let result = this._super(...arguments);

    result += '?fields=-ssl_certificate';

    return result;
  }
});
