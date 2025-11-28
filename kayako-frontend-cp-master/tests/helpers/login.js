import { registerAsyncHelper } from '@ember/test';

export default registerAsyncHelper('login', function(app, sessionId = '1') {
  let sessionService = app.__container__.lookup('service:session');
  let locale = app.__container__.lookup('service:locale');
  locale.setup();
  sessionService.set('sessionId', null);
  sessionService.set('sessionId', sessionId);
  sessionService.set('csrfToken', 'a-csrf-token');
});
