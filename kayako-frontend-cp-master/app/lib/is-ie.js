export default function (version, comparison) {
  let cc = 'IE';
  let b = document.createElement('B');
  let isIE;

  const docElem = document.documentElement;

  if (version) {
    cc += ' ' + version;
    if (comparison) {
      cc = comparison + ' ' + cc;
    }
  }

  b.innerHTML = '<!--[if ' + cc + ']><b id="iecctest"></b><![endif]-->';
  docElem.appendChild(b);
  isIE = !!document.getElementById('iecctest');
  docElem.removeChild(b);

  return isIE;
}
