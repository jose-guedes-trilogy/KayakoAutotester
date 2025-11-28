import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  // Attributes
  generatingToken: false,
  iframeLoaded: false,
  iframeSrc: null,
  reloadingIframe: false,
  failedIframe: false
});
