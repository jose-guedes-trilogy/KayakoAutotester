import $ from 'jquery';
import { registerAsyncHelper } from '@ember/test';

export default registerAsyncHelper('scrollToBottomOfPage', function(app) {
  $('#ember-testing-container').scrollTop($('#ember-testing-container')[0].scrollHeight);
});

