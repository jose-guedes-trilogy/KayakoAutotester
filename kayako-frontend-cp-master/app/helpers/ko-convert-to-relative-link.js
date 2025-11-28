import { helper } from '@ember/component/helper';
import { isInternalURL, stripDomain } from 'frontend-cp/helpers/ko-linkify';

export default helper(([url]) => {
  if (url && isInternalURL(url)) {
    return stripDomain(url);
  } else {
    return url;
  }
});
