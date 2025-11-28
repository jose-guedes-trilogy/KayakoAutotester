import BaseAdapter from 'ember-metrics/metrics-adapters/segment';
import { compact } from 'ember-metrics/utils/object-transforms';

export default BaseAdapter.extend({
  group(options = {}) {
    const groupId = options.groupId;
    Reflect.deleteProperty(options, 'groupId');

    window.analytics.group(groupId, compact(options));
  }
});
