import Component from 'ember-basic-dropdown/components/basic-dropdown';
import calculatePosition from 'ember-basic-dropdown/utils/calculate-position';
import fallbackIfUndefined from 'ember-basic-dropdown/utils/computed-fallback-if-undefined';
import { isBlank } from '@ember/utils';

function calculatePositionWithMargins(trigger, dropdown, destination, options) {
  let result = calculatePosition(trigger, dropdown, destination, options);
  if (isBlank(result.style) || isBlank(result.style.width)) {
    return result;
  }

  let dropdownStyle = window.getComputedStyle(dropdown);
  let marginLeft = parseFloat(dropdownStyle.marginLeft);
  let marginRight = parseFloat(dropdownStyle.marginRight);
  let marginTotal = marginLeft + marginRight;

  result.style.width = (parseFloat(result.style.width) - marginTotal);

  return result;
}

export default Component.extend({
  calculatePosition: fallbackIfUndefined(calculatePositionWithMargins)
});
