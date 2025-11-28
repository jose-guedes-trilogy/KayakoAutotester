import { computed } from '@ember/object';
import formatSeconds from 'frontend-cp/lib/humanize-seconds';

export default function(paramName) {
  return computed(paramName, function() {
    const param = this.get(paramName);

    if (!param) {
      return null;
    }

    return formatSeconds(param);
  });
}
