import ApplicationAdapter from './application';


export default ApplicationAdapter.extend({
  autoIncludeAll: true,

  ajax(url, method, params) {
    if (params && params.data) {
      switch (this._mode(params.data)) {
        case 'organizationList':
          delete(params.data.offset);
          delete(params.data.limit);

          return this._super(url, 'POST', params);
        default:
          return this._super(url, method, params);
      }
    } else {
      return this._super(url, method, params);
    }
  },

  urlForQuery(query) {
    switch (this._mode(query)) {
      case 'autocomplete':
        return `${this.urlPrefix()}/autocomplete/organizations`;
      case 'organizationList':
        return `${this.urlPrefix()}/organizations/filter?offset=${query.offset}&limit=${query.limit}`;
      default:
        return this._super(...arguments);
    }
  },

  // We assume that all endpoints, apart from /cases/:id, might return cases with
  // some fields potentially missing. _isFullyLoaded is set automatically during
  // queryRecord.
  shouldReloadRecord(store, snapshot) {
    return !snapshot.record.get('_isFullyLoaded');
  },

  fetchMembers(id) {
    let url = `${this.namespace}/organizations/${id}/members`;
    return this.ajax(url, 'GET', {data: {include: '', fields: 'avatar,full_name', limit: 999}});
  },

  _mode(param) {
    if (param.predicates) {
      return 'organizationList';
    } else if (param.name) {
      return 'autocomplete';
    } else {
      return '';
    }
  }
});
