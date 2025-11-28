import { registerAsyncHelper } from '@ember/test';
import {
  sessionIdCookieName,
  sessionIdCookieDomain,
  rememberMeCookieName
} from 'frontend-cp/services/session';

export default registerAsyncHelper('logout', function() {
  localStorage.removeItem('sessionId');
  localStorage.removeItem('tabs');
  document.cookie = `${sessionIdCookieName}=; expires=0; domain=${sessionIdCookieDomain}; path=/`;
  document.cookie = `${rememberMeCookieName}=; expires=0; domain=${sessionIdCookieDomain}; path=/`;
});
