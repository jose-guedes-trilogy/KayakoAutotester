if (!('Intl' in window)) {
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = (window.ASSET_ROOT || '') + '{{rootURL}}assets/intl/intl.complete.js';
  script.defer = true;
  document.body.appendChild(script);
}