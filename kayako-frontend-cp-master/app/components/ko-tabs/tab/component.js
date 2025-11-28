import Component from '@ember/component';

export default Component.extend({
  tagName: 'li',

  // Attributes
  _null: null,
  shrink: false,
  routeName: null,
  queryParams: {},
  dynamicSegments: []
});
