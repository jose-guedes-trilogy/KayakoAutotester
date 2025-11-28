import $ from 'jquery';

export function initialize(/* application */) {
  $('#preboot-spinner').remove();
}

export default {
  name: 'remove-preboot-spinner',
  initialize
};
