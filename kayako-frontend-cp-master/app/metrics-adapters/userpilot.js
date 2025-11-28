import BaseAdapter from 'ember-metrics/metrics-adapters/base';
import { inject as service } from '@ember/service';

export default BaseAdapter.extend({

  sessionService: service('session'),

  toStringExtension() {
    return 'userpilot';
  },

  init() {

  },

  identify(data) {
    window.userpilot.identify(data.distinctId, {
      name: data.name,
      email: data.email,
      created_at: data.created_at,
      company: {
        name: data.instance_name,
        id: this.get('sessionService.session.instanceId')
      },
      role_type: data.role_type,
      locale: data.locale
    });
  },

  trackEvent(data) {
    const event = data.event;
    const attributes = Object.assign({}, data);
    delete attributes.event;
    window.userpilot.track(event, attributes);
  },

  trackPage(data) {
    window.userpilot.track('page_viewed', data);
  },

  alias() {

  },

  group() {

  },

  willDestroy() {

  }
});
