import Component from '@ember/component';
import { empty } from '@ember/object/computed';

export default Component.extend({
  tagName: '',
  item: null,
  noRecipients: empty('item.original.recipients')
});
