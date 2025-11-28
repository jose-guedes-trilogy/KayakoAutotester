import { assign } from '@ember/polyfills';

export default function dispatchEvent(element, eventName, opts = {}) {
  let oEvent = document.createEvent('Events');
  oEvent.initEvent(eventName, true /* bubbles */, true /* cancelable */);

  if (opts.keyCode && !opts.charCode) {
    opts.charCode = opts.keyCode;
  }

  let defaults = {
    view: window,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false
  };

  assign(oEvent, defaults);
  assign(oEvent, opts);

  element.dispatchEvent(oEvent);
}
