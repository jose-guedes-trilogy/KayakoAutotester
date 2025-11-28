import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  pathForType() {
    return 'conversations/starter';
  },
  fetchForBrand(brandId) {
    const url = '/api/v1/conversations/starter';
    return this.ajax(url, 'GET', { data: { include: '', brand: brandId }});
  }
});
