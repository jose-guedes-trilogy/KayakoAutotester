import { helper } from '@ember/component/helper';
import { inlineSvg } from 'ember-inline-svg/helpers/inline-svg';
import { htmlSafe } from '@ember/string';
import SVGs from '../svgs';

export default helper(function([path], options) {
  let svg = inlineSvg(SVGs, path, options);
  svg = svg.string.replace(/%UID%/g, randomString(10));
  return htmlSafe(svg);
});

function randomString(length) {
  let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  let i;
  for (i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}
