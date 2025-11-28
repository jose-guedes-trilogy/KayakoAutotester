import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  handleErrors(promise) {
    return promise;
  }
});
