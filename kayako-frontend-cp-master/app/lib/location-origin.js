let locationOrigin = window.location.origin;

if (!window.location.origin) {
  locationOrigin = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
}

export default locationOrigin;
