import { htmlSafe } from '@ember/string';
import { helper } from '@ember/component/helper';

export default helper(([fullString, emboldenString]) => {
  if (emboldenString) {
    let regExp = new RegExp(emboldenString.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1'), 'gi');
    return htmlSafe((fullString || '').replace(regExp, '<b>$&</b>'));
  } else {
    return fullString;
  }
});
