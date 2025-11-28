import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  urlForQuery(query) {
    if (query.twitterIds) {
      let ids = query.twitterIds;
      Reflect.deleteProperty(query, 'twitterIds');
      return this.urlPrefix() + `/twitter/tweets/latest?account_ids=${ids}`;
    } else {
      return this._super(...arguments);
    }
  }
});
