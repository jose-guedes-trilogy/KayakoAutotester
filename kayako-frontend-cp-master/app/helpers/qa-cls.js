import { htmlSafe } from '@ember/string';
import { helper } from '@ember/component/helper';
import Ember from 'ember';

export default helper((classNames) => {
  if (Ember.testing) {
    return htmlSafe(classNames.join(' '));
  }

  return '';
});
