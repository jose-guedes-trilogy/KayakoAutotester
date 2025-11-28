import Component from '@ember/component';
import { computed } from '@ember/object';
import originLocation from 'frontend-cp/lib/location-origin';

export default Component.extend({
  tagName: '',

  article: null,

  title: computed.readOnly('article.title'),

  originLocation: originLocation
});
