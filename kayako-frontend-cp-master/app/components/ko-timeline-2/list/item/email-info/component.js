import Component from '@ember/component';
import { filterBy, or } from '@ember/object/computed';

export default Component.extend({
  tagName: '',

  // Attributes
  post: null,

  // CPs
  ccRecipients: filterBy('post.recipients', 'isCC'),
  toRecipients: filterBy('post.recipients', 'isTo'),
  show: or('post.email', 'ccRecipients.length', 'toRecipients.length'),

  onAddCC: () => {}
});
