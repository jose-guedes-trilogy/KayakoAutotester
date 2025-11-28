import { helper } from '@ember/component/helper';
import Ember from 'ember';

export default helper(([content]) => {
  let text = Ember.Handlebars.Utils.escapeExpression(content);
  return new Ember.Handlebars.SafeString(text.replace(/(\r\n|\n|\r)/gm, '<br />'));
});

