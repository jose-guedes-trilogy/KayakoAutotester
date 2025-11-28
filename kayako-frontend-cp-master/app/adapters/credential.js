import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  headers: {
    Accept: 'application/json',
    'X-Options': 'flat',
    'X-Requested-With': 'XMLHttpRequest'
  }
});
