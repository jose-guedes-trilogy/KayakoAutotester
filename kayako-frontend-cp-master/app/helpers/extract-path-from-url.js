import { helper } from '@ember/component/helper';

export function extractPathFromUrl(pageUrl) {
  pageUrl = pageUrl.trim();

  if (typeof pageUrl !== 'string' || pageUrl === '') {
    return '';
  }

  // If scheme is absent prepend it to the url
  if (!pageUrl.match(/^[a-zA-Z]+:\/\//)) {
    pageUrl = `http://${pageUrl}`;
  }

  const a = document.createElement('a');
  a.href = pageUrl;

  // If pathname is empty return hostname instead
  return a.pathname === '/' ? a.hostname : a.pathname;
}

export default helper(([url]) => extractPathFromUrl(url));
