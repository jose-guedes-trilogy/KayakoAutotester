import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  user: null,
  size: 'normal',   // [nano | micro | small | submedium | medium | large]
  type: 'square'
});
