import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  urlForQueryRecord(query) {
    if (query.callback.match('twitter')) {
      return this.buildURL() + '/twitter/account/link';
    } else if (query.callback.match('facebook')) {
      return this.buildURL() + '/facebook/account/link';
    } else {
      throw new Error('You have to specify a query type');
    }
  }
});
