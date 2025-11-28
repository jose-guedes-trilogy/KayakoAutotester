import EmberObject from '@ember/object';
import _ from 'npm:lodash';

function convertValue(value) {
  if (_.isArray(value)) {
    return convertArray(value);
  } else if (_.isObject(value)) {
    return jsonToObject(value);
  } else {
    return value;
  }
}

function convertArray(array) {
  return array.map(convertValue);
}

export function jsonToObject(object) {
  return EmberObject.create(_.mapValues(object, convertValue));
}
