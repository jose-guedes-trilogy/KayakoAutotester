import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  ajax(url, method, params) {
    if (params && params.data) {
      switch (this._mode(params.data)) {
        case 'userList':
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
        return `${this.urlPrefix()}/autocomplete/users`;
      case 'userList':
        return `${this.urlPrefix()}/users/filter?offset=${query.offset}&limit=${query.limit}`;
      default:
        return this._super(...arguments);
    }
  },

  urlForQueryRecord(query) {
    if (query.id === 'me') {
      Reflect.deleteProperty(query, 'id');
      return '/api/v1/me';
    } else {
      return this._super(...arguments);
    }
  },

  findHasMany(store, snapshot, url, relationship) {
    if (relationship.key === 'recentCases') {
      const data = {
        limit: 999,
        fields: 'requester,assigned_agent(*),assigned_team(*),status,updated_at,subject',
        include: ['case_status']
      };
      url = this.urlPrefix(url, this.buildURL(snapshot.modelName, snapshot.id, snapshot, 'findHasMany'));
      return this.ajax(url, 'GET', {data: data});
    }

    return this._super(...arguments);
  },

  // We assume that all endpoints, apart from /cases/:id, might return cases with
  // some fields potentially missing. _isFullyLoaded is set automatically during
  // queryRecord.
  shouldReloadRecord(store, snapshot) {
    return !snapshot.record.get('_isFullyLoaded');
  },

  deleteAvatar(userid) {
    let url = `${this.namespace}/profile/avatar`;
    return this.ajax(url, 'DELETE');
  },

  fetchAvatar(userid) {
    let url = `${this.namespace}/users/${userid}/avatar`;
    return this.ajax(url, 'GET');
  },

  updateAvatar(userid, data) {
    let url = `${this.namespace}/users/${userid}/avatar`;
    return this.ajax(url, 'PUT', {data});
  },

  updateSignature(userId, signature) {
    let url = `${this.namespace}/users/${userId}`;
    return this.ajax(url, 'PUT', {
      data: {
        signature: signature
      }
    });
  },

  getQrCode() {
    let url = `${this.namespace}/profile/twofactor`;
    return this.ajax(url, 'GET');
  },

  sendTwoFactorCode(data) {
    let url = `${this.namespace}/profile/twofactor`;
    return this.ajax(url, 'POST', {data});
  },

  removeSelfTwoFactorAuth() {
    let url = `${this.namespace}/profile/twofactor`;
    return this.ajax(url, 'DELETE');
  },

  removeTwoFactorAuth(userId) {
    let url = `${this.namespace}/users/${userId}/twofactor`;
    return this.ajax(url, 'DELETE');
  },

  changePassword(password, newPassword) {
    let url = `${this.namespace}/profile/password`;
    return this.ajax(url, 'PUT', {
      data: {
        password: password,
        new_password: newPassword
      }
    });
  },

  _mode(param) {
    if (param.predicates) {
      return 'userList';
    } else if (param.name) {
      return 'autocomplete';
    } else {
      return '';
    }
  }
});
