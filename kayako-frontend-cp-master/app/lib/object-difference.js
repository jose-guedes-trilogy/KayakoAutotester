import _ from 'npm:lodash';

export default function(oldValues = {}, newValues = {}) {
  if (Object.keys(newValues).length > Object.keys(oldValues).length) {
    let temp = oldValues;
    oldValues = newValues;
    newValues = temp;
  }

  return _.reduce(oldValues, function(result, value, key) {
    return _.isEqual(value, newValues[key]) ?
      result : result.concat(key);
  }, []);
}
