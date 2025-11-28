import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  urlForQuery(query) {
    if (query.productId) {
      let id = query.productId;
      Reflect.deleteProperty(query, 'productId');
      return this.urlPrefix() + `/account/products/${id}/rateplans`;
    } else {
      return this._super(...arguments);
    }
  },

  pathForType () {
    return 'account/rateplans';
  }
});
