import { module } from 'qunit';
import { resolve } from 'rsvp';
import startApp from '../helpers/start-app';
import destroyApp from '../helpers/destroy-app';
import MockSocket from '../helpers/mocks/socket';

import StubClient from 'ember-launch-darkly/test-support/helpers/launch-darkly-client-test';

export default function(name, options = {}) {
  module(name, {
    beforeEach() {
      this.application = startApp({
        socketConstructor: MockSocket
      });

      this.socket = () => {
        return this.application.__container__.lookup('service:socket')._socket;
      };

      this.application.__container__.registry.register('service:launch-darkly-client', StubClient);

      if (options.beforeEach) {
        return Reflect.apply(options.beforeEach, this, arguments);
      }
    },

    afterEach() {
      let afterEach = options.afterEach && Reflect.apply(options.afterEach, this, arguments);
      return resolve(afterEach).then(() => destroyApp(this.application));
    }
  });
}
