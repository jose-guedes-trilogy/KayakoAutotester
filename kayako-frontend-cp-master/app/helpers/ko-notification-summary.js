import { helper } from '@ember/component/helper';
import Ember from 'ember';
const regex = /(?:&lt;).+?\|([\s\S.]+?)&gt;/g;

export default helper(([content]) => {
  let text = Ember.Handlebars.Utils.escapeExpression(content);
  return new Ember.Handlebars.SafeString(text.replace(regex, '<strong>$1</strong>'));
});

