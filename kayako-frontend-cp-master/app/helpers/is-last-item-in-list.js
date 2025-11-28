import { helper } from '@ember/component/helper';

export default helper(([item, list]) => {
  let listLength = list.get('length');
  if (listLength === 0) {
    return false;
  }

  return list.objectAt(listLength - 1) === item;
});
