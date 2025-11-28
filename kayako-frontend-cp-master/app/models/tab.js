import EmberObject from '@ember/object';

export default EmberObject.extend({

  /**
   * Tab base URL
   * Path to the tab's 'home' page.
   * This is used to check whether a page falls within this tab's remit.
   * @type {[type]}
   */
  baseUrl: null,

  /**
   * Tab URL
   * Path to the page that's currently displayed in the tab.
   * This will either be the `baseUrl` or one of its descendant URLs.
   * @type {string}
   */
  url: null,

  /**
   * Tab label
   * @type {string}
   */
  label: null,

  /**
   * Whether the tab is currently selected
   * @type {boolean}
   */
  selected: false,

  /**
   * UI state object
   * Ember object containing UI state related to this tab
   * @type {Object}
   */
  state: null
});
