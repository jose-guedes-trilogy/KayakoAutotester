/* eslint-disable no-console */

import ENV from 'frontend-cp/config/environment';

export default {
  name: 'print-git-info',

  initialize: function () {
    if (ENV.environment !== 'test') {
      console.log(ENV.currentRevision);
    }
  }
};
