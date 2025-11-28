import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  pathForType() {
    return 'timetracking/tracked?limit=20';
  }
});
