import { Socket } from 'phoenix';

export function initialize(application) {
  let socketConstructor = application.socketConstructor || Socket;
  application.register('constructor:socket', socketConstructor, { instantiate: false });
}

export default {
  name: 'phoenix-socket',
  initialize
};
