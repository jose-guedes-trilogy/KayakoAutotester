import mappings from './mappings';

function _stringify(obj) {
  return Object.keys(obj).map(key => {
    if (Object.keys(obj[key]).length) {
      return `${key}(${_stringify(obj[key])})`;
    }

    return key;
  }).join(',');
}

function _mapColumnNamesToFieldsAndIncludes(columnNames) {
  let { fields, includes } = columnNames.reduce((obj, columnName) => {
    if (columnName.startsWith('case_field_')) {
      obj.fields = obj.fields.concat(['custom_fields']);
    } else {
      let mapping = mappings[columnName];

      if (mapping) {
        obj.fields = obj.fields.concat(mapping.fields || []);
        obj.includes = obj.includes.concat(mapping.includes || []);
      }
    }

    return obj;
  }, { fields: [], includes: [] });

  return {
    fields: fields.uniq(),
    includes: includes.uniq()
  };
}

function _flattenAndStringifyFields(fields) {
  let flattenedFields = {};

  fields.forEach(field => {
    let parts = field.split('.');

    parts.reduce((flattened, current) => {
      if (!flattened[current]) {
        flattened[current] = {};
      }

      return flattened[current];
    }, flattenedFields);

  });

  return _stringify(flattenedFields);
}

export default function(columnNames = []) {
  let { fields, includes } = _mapColumnNamesToFieldsAndIncludes(columnNames);

  let fieldsString = _flattenAndStringifyFields(fields);
  let includesString = includes.join(',');

  return { fields: fieldsString, includes: includesString };
}
