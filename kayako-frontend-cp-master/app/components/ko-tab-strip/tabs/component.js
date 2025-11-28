import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  'on-close': () => {},

  tabComponentName(type) {
    if (type) {
      return `ko-tab-strip/${type}-tab`;
    }

    throw new Error(`Unknown tab type: ${type}`);
  }
});
