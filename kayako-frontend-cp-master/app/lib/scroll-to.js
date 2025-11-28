import RSVP from 'rsvp';
import { run } from '@ember/runloop';
import jQuery from 'jquery';

export const TOP = 'TOP';
export const MIDDLE = 'MIDDLE';
export const BOTTOM = 'BOTTOM';

export function scrollTo({ parent = null, element = null, position = BOTTOM, animated = false } = {}) {
  return new RSVP.Promise(resolve => {
    let scrollTop;
    if (element && element.length) {
      let itemTop = element.prop('offsetTop');
      let itemHeight = element.outerHeight(true);
      let parentHeight = parent.height();

      // if the item is too big to fit on the screen, position it at the top
      // so we cut off the bottom and not the top
      if (itemHeight >= parentHeight) {
        position = TOP;
      }

      switch (position) {
        case TOP:
          scrollTop = itemTop;
          break;

        case MIDDLE:
          scrollTop = itemTop - (parentHeight / 2) + (itemHeight / 2);
          break;

        default: // BOTTOM
          scrollTop = itemTop - parentHeight + itemHeight;
          break;
      }
    } else {
      // NOTE - don't support scrolling to MIDDLE of parent
      //        as that makes no sense...
      switch (position) {
        case TOP:
          scrollTop = 0;
          break;

        default: // BOTTOM
          scrollTop = parent.prop('scrollHeight');
          break;
      }
    }

    if (animated) {
      parent
        .animate({ scrollTop }, { duration: 'slow' })
        .promise()
        .done(() => run(resolve));
    } else {
      parent.scrollTop(scrollTop);
      resolve();
    }
  });
}

export function isVisibleInScrollArea(el, parent) {
  if (el instanceof jQuery) {
    el = el[0];
  }

  if (parent instanceof jQuery) {
    parent = parent[0];
  }

  const elPos = el.getBoundingClientRect();
  const parentPos = parent.getBoundingClientRect();

  return elPos.top >= parentPos.top &&
         elPos.top <= parentPos.bottom &&
         elPos.bottom >= parentPos.top &&
         elPos.bottom <= parentPos.bottom;
}

export function isAtTop(parent) {
  let min = 0;
  let scrollTop = parent.scrollTop();
  return scrollTop <= min;
}

export function isAtBottom(parent) {
  let max = parent.prop('scrollHeight') - parent.height();
  let scrollTop = parent.scrollTop();
  return scrollTop >= max;
}
