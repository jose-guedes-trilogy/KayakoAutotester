import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({

  handleResponse: function(status, headers, payload) {
    if (headers['date-iso']) {
      this.get('serverClock').set('lastKnownServerTime', headers['date-iso']);
    }
    if (this.isSuccess(status, headers, payload)) {
      return payload;
    } // do not show notification for errors on preview request
  }

});
