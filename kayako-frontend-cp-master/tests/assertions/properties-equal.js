import EmberObject from '@ember/object';
import QUnit from 'qunit';

export default function propertiesEqual(actual, expected, message) {
  let expectedProperties = (expected instanceof EmberObject ? getEmberObjectProperties(expected) : expected);
  if (!actual) {
    this.push(false, actual, expectedProperties, message);
    return;
  }
  let actualProperties = getEmberObjectProperties(actual);
  let objectsAreEqual = QUnit.equiv(actualProperties, expectedProperties);
  this.push(objectsAreEqual, actualProperties, expectedProperties, message);
}

function getEmberObjectProperties(value) {
  if (!value) {
    return parsePrimitive(value);
  } else if (Array.isArray(value)) {
    return parseArray(value);
  } else if (value instanceof EmberObject) {
    return parseEmberObject(value);
  } else if (value instanceof Object) {
    return parseObject(value);
  }

  return value;

  function parsePrimitive(value) {
    return value;
  }

  function parseEmberObject(value) {
    let properties = value.getProperties(Object.keys(value));
    return parseObject(properties);
  }

  function parseObject(value) {
    return Object.keys(value).reduce((fields, key) => {
      fields[key] = getEmberObjectProperties(value[key]);
      return fields;
    }, {});
  }

  function parseArray(value) {
    return value.map(item => getEmberObjectProperties(item));
  }
}
