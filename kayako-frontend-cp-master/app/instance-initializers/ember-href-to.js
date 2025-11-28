// modifies ember-href-to to allow skipping links inside containers marked data-href-to-ignore
// not just if that's on the link themselves.
// No nice way to override other than modifying the entire of the initializer
// until the addon is modernized - https://github.com/intercom/ember-href-to/issues/88
// everything below is copied from ember-href-to except where marked with @kayako comments

import HrefTo from 'ember-href-to/href-to';

function closestLink(el) {
  if (el.closest) {
    return el.closest('a');
  } else {
    el = el.parentElement;
    while (el && el.tagName !== 'A') {
      el = el.parentElement;
    }
    return el;
  }
}

export default {
  name: 'ember-href-to',
  initialize(applicationInstance) {
    // we only want this to run in the browser, not in fastboot
    if (typeof(FastBoot) === 'undefined') {
      let hrefToClickHandler = function _hrefToClickHandler(e) {
        let link = e.target.tagName === 'A' ? e.target : closestLink(e.target);

        // if (link) { // - @kayako modification
        if (link && shouldHandle(e)) {
          let hrefTo = new HrefTo(applicationInstance, e, link);
          hrefTo.maybeHandle();
        }
      };


      document.body.addEventListener('click', hrefToClickHandler);

      // Teardown on app destruction: clean up the event listener to avoid
      // memory leaks.
      applicationInstance.reopen({
        willDestroy() {
          document.body.removeEventListener('click', hrefToClickHandler);
          return this._super(...arguments);
        }
      });
    }
  }
};

// @kayako modification - ignore click if it's inside a container with data-href-to-ignore attribute
import jQuery from 'jquery';
function shouldHandle(e) {
  return !jQuery(e.target).closest('[data-href-to-ignore]').length;
}
