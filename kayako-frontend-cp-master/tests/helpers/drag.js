//unashamedly stolen from ember-sortable test helper

import { registerAsyncHelper } from '@ember/test';

import $ from 'jquery';

export function drag(app, mode, itemSelector, offsetFn, callbacks = {}) {
  let start, move, end, which;

  const {
    andThen,
    findWithAssert,
    wait
  } = app.testHelpers;

  if (mode === 'mouse') {
    start = 'mousedown';
    move = 'mousemove';
    end = 'mouseup';
    which = 1;
  } else if (mode === 'touch') {
    start = 'touchstart';
    move = 'touchmove';
    end = 'touchend';
  } else {
    throw new Error(`Unsupported mode: '${mode}'`);
  }

  andThen(() => {
    let item = findWithAssert(itemSelector);
    let itemOffset = item.offset();
    let offset = offsetFn();
    let targetX = itemOffset.left + offset.dx;
    let targetY = itemOffset.top + offset.dy;

    triggerEvent(app, item, start, {
      pageX: itemOffset.left,
      pageY: itemOffset.top,
      which
    });

    if (callbacks.dragstart) {
      andThen(callbacks.dragstart);
    }

    triggerEvent(app, item, move, {
      pageX: itemOffset.left,
      pageY: itemOffset.top
    });

    if (callbacks.dragmove) {
      andThen(callbacks.dragmove);
    }

    triggerEvent(app, item, move, {
      pageX: targetX,
      pageY: targetY
    });

    triggerEvent(app, item, end, {
      pageX: targetX,
      pageY: targetY
    });

    if (callbacks.dragend) {
      andThen(callbacks.dragend);
    }
  });

  return wait();
}

function triggerEvent(app, el, type, props) {
  return app.testHelpers.andThen(() => {
    let event = $.Event(type, props);
    $(el).trigger(event);
  });
}

export default registerAsyncHelper('drag', drag);
