import platform from 'npm:platform';

export function isMac () {
  return platform.os && platform.os.family && platform.os.family.match(/os x|ios/i);
}

export let isRetina = (function () {
  const mediaQuery = '(-webkit-min-device-pixel-ratio: 1.5),(min--moz-device-pixel-ratio: 1.5),(-o-min-device-pixel-ratio: 3/2),(min-resolution: 1.5dppx)';
  return (window.devicePixelRatio > 1) || !!(window.matchMedia && window.matchMedia(mediaQuery).matches);
}());
