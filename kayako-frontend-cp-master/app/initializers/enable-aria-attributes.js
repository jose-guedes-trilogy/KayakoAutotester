import LinkComponent from '@ember/routing/link-component';

export function initialize(/* application */) {
  LinkComponent.reopen({
    attributeBindings: ['aria-label']
  });
}

export default {
  name: 'enable-aria-attributes',
  initialize
};
