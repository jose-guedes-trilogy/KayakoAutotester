import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  urlForQueryRecord(query) {
    const brandId = query.brand.id;
    const name = query.name;
    Reflect.deleteProperty(query, 'brand');
    Reflect.deleteProperty(query, 'name');
    return this.namespace + `/brands/${brandId}/templates/${name}`;
  },

  urlForUpdateRecord(id) {
    return this.namespace + id.split(this.namespace)[1];
  },

  updateTempalte(brandId, name, contents) {
    let url = `${this.namespace}/brands/${brandId}/templates/${name}`;
    return this.ajax(url, 'PUT', {
      data: {
        contents: contents
      }
    });
  }
});
