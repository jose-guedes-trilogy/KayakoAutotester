/* eslint-disable no-console */

import ENV from 'frontend-cp/config/environment';


function makeBlocks(numBlocks) {
  // a block is 12x7 pix, but we're inputting 1px by 1px values. Try to stretch to make it accurate
  let stretchedBlocks = numBlocks + Math.floor(numBlocks / 2);
  return '%c' + Array(stretchedBlocks + 1).join('\u2588');
}

function makeStyle(color) {
  return 'color: ' + color;
}

const DARK_GREEN = '#69aab5';
const LIGHT_GREEN = '#85b8c1';
const PINK = '#f39d90';
const DARK_RED = '#f66f6d';
const SKIN = '#ffb1a2';
const LIGHT_ORANGE = '#f37036';
const DARK_PINK = '#fa8176';
const DARK_ORANGE = '#f35918';

export default {
  name: 'print-logo',

  initialize: function () {
    if (ENV.environment === 'development' || window.location.hostname === 'support.kayako.com') {
      let chars = '';
      let styles = [];

      chars += makeBlocks(14); styles.push(makeStyle(DARK_GREEN));
      chars += makeBlocks(9); styles.push(makeStyle(LIGHT_GREEN));
      chars += '\n';

      chars += makeBlocks(13); styles.push(makeStyle(DARK_GREEN));
      chars += makeBlocks(9); styles.push(makeStyle(LIGHT_GREEN));
      chars += '\n';

      chars += makeBlocks(12); styles.push(makeStyle(DARK_GREEN));
      chars += makeBlocks(9); styles.push(makeStyle(LIGHT_GREEN));
      chars += '\n';

      chars += makeBlocks(11); styles.push(makeStyle(DARK_GREEN));
      chars += makeBlocks(9); styles.push(makeStyle(LIGHT_GREEN));
      chars += '\n';

      chars += makeBlocks(10); styles.push(makeStyle(DARK_GREEN));
      chars += makeBlocks(9); styles.push(makeStyle(LIGHT_GREEN));
      chars += '\n';

      chars += makeBlocks(2); styles.push(makeStyle(PINK));
      chars += makeBlocks(7); styles.push(makeStyle(DARK_GREEN));
      chars += makeBlocks(9); styles.push(makeStyle(LIGHT_GREEN));
      chars += '\n';

      chars += makeBlocks(4); styles.push(makeStyle(PINK));
      chars += makeBlocks(4); styles.push(makeStyle(DARK_GREEN));
      chars += makeBlocks(9); styles.push(makeStyle(LIGHT_GREEN));
      chars += '\n';

      chars += makeBlocks(5); styles.push(makeStyle(PINK));
      chars += makeBlocks(2); styles.push(makeStyle(DARK_GREEN));
      chars += makeBlocks(9); styles.push(makeStyle(LIGHT_GREEN));
      chars += '\n';

      chars += makeBlocks(6); styles.push(makeStyle(PINK));
      chars += makeBlocks(2); styles.push(makeStyle(SKIN));
      chars += makeBlocks(7); styles.push(makeStyle(LIGHT_GREEN));
      chars += '\n';

      chars += makeBlocks(1); styles.push(makeStyle(DARK_RED));
      chars += makeBlocks(4); styles.push(makeStyle(PINK));
      chars += makeBlocks(4); styles.push(makeStyle(SKIN));
      chars += makeBlocks(5); styles.push(makeStyle(LIGHT_GREEN));
      chars += '\n';

      chars += makeBlocks(2); styles.push(makeStyle(DARK_RED));
      chars += makeBlocks(2); styles.push(makeStyle(PINK));
      chars += makeBlocks(6); styles.push(makeStyle(SKIN));
      chars += makeBlocks(3); styles.push(makeStyle(LIGHT_GREEN));
      chars += '\n';

      chars += makeBlocks(3); styles.push(makeStyle(DARK_RED));
      chars += makeBlocks(8); styles.push(makeStyle(SKIN));
      chars += makeBlocks(1); styles.push(makeStyle(LIGHT_GREEN));
      chars += '\n';

      chars += makeBlocks(3); styles.push(makeStyle(DARK_RED));
      chars += makeBlocks(8); styles.push(makeStyle(SKIN));
      chars += makeBlocks(1); styles.push(makeStyle(LIGHT_ORANGE));
      chars += '\n';

      chars += makeBlocks(2); styles.push(makeStyle(DARK_RED));
      chars += makeBlocks(2); styles.push(makeStyle(DARK_PINK));
      chars += makeBlocks(6); styles.push(makeStyle(SKIN));
      chars += makeBlocks(3); styles.push(makeStyle(LIGHT_ORANGE));
      chars += '\n';

      chars += makeBlocks(1); styles.push(makeStyle(DARK_RED));
      chars += makeBlocks(4); styles.push(makeStyle(DARK_PINK));
      chars += makeBlocks(4); styles.push(makeStyle(SKIN));
      chars += makeBlocks(5); styles.push(makeStyle(LIGHT_ORANGE));
      chars += '\n';

      chars += makeBlocks(6); styles.push(makeStyle(DARK_PINK));
      chars += makeBlocks(2); styles.push(makeStyle(SKIN));
      chars += makeBlocks(7); styles.push(makeStyle(LIGHT_ORANGE));
      chars += '\n';

      chars += makeBlocks(5); styles.push(makeStyle(DARK_PINK));
      chars += makeBlocks(2); styles.push(makeStyle(DARK_ORANGE));
      chars += makeBlocks(9); styles.push(makeStyle(LIGHT_ORANGE));
      chars += '\n';

      chars += makeBlocks(4); styles.push(makeStyle(DARK_PINK));
      chars += makeBlocks(4); styles.push(makeStyle(DARK_ORANGE));
      chars += makeBlocks(9); styles.push(makeStyle(LIGHT_ORANGE));
      chars += '\n';

      chars += makeBlocks(2); styles.push(makeStyle(DARK_PINK));
      chars += makeBlocks(7); styles.push(makeStyle(DARK_ORANGE));
      chars += makeBlocks(9); styles.push(makeStyle(LIGHT_ORANGE));
      chars += '\n';

      chars += makeBlocks(10); styles.push(makeStyle(DARK_ORANGE));
      chars += makeBlocks(9); styles.push(makeStyle(LIGHT_ORANGE));
      chars += '\n';

      chars += makeBlocks(11); styles.push(makeStyle(DARK_ORANGE));
      chars += makeBlocks(9); styles.push(makeStyle(LIGHT_ORANGE));
      chars += '\n';

      chars += makeBlocks(12); styles.push(makeStyle(DARK_ORANGE));
      chars += makeBlocks(9); styles.push(makeStyle(LIGHT_ORANGE));
      chars += '\n';

      chars += makeBlocks(13); styles.push(makeStyle(DARK_ORANGE));
      chars += makeBlocks(9); styles.push(makeStyle(LIGHT_ORANGE));
      chars += '\n';

      chars += makeBlocks(14); styles.push(makeStyle(DARK_ORANGE));
      chars += makeBlocks(9); styles.push(makeStyle(LIGHT_ORANGE));
      chars += '\n';

      console.log(chars, ...styles);
    }
  }
};
