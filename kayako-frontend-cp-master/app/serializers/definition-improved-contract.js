import ApplicationSerializer from './application';
import _ from 'npm:lodash';

export default ApplicationSerializer.extend({
  primaryKey: 'field',

  extractAttributes(modelClass, resourceHash) {
    resourceHash.values = _.map(resourceHash.values, (val, id) => ({
      value: id,
      string: val
    }));
    return this._super(...arguments);
  },

  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    if (!payload.data || !Array.isArray(payload.data)) {
      return this._super(...arguments);
    }

    return normalizeToImprovedContract(payload);

    //debugger;
    //return this._super(store, primaryModelClass, modifiedPayload, id, requestType);
  }
});

export function normalizeToImprovedContract(payload) {
  let data = [];
  let operators = [];
  let inputs = [];

  payload.data.forEach((record, i) => {
    if (!data.mapBy('attributes.label').includes(record.label)) {
      //build a new data object with operators as relationships
      data.push({
        id: record.field,
        type: 'definition_improved_contract',
        attributes: {
          label: record.label
        },
        relationships: {
          operators: {
            data: record.operators.map(operator => {
              return {
                id: buildUniqueFieldId(record, operator),
                type: 'definition_improved_contract_operator'
              };
            })
          }
        }
      });
    } else {
      //this is a field that needs to be coalesced
      //find the existing entry in the new data object and append the operators as relationships to the existing operator collection
      let existingField = data.find(obj => {
        return obj.attributes.label === record.label;
      });

      existingField.relationships.operators.data = [
        ...existingField.relationships.operators.data,
        ...record.operators.map(operator => {
          return {
            id: buildUniqueFieldId(record, operator),
            type: 'definition_improved_contract_operator'
          };
        })
      ];
    }

    record.operators.forEach((operator, i) => {
      //build operator includes
      operators.push({
        id: buildUniqueFieldId(record, operator),
        type: 'definition_improved_contract_operator',
        attributes: {
          label: operator,
          originalFieldName: record.field
        },
        relationships: {
          input: {
            data: {
              id: record.field,
              type: 'definition_improved_contract_input'
            },

          },
        }
      });

      if (!inputs.mapBy('id').includes(record.field)) {
        //build input includes
        inputs.push({
          id: record.field,
          type: 'definition_improved_contract_input',
          attributes: {
            inputType: record.input_type,
            values: convertKeyValueObjectToArrayOfKeyValueObjects(record.values)
          }
        });
      }
    });
  });

  return {
    data: data,
    included: [
      ...operators,
      ...inputs
    ]
  };
}

function buildUniqueFieldId(record, operator) {
  return `${record.label.toLowerCase().replace(/\s+/g, '_')}_${operator}`;
}

function convertKeyValueObjectToArrayOfKeyValueObjects(obj) {
  if (!obj) {
    return;
  }

  let keys = Object.keys(obj);
  let values = Object.values(obj);
  let keyValueObjects = [];

  keys.forEach((key, i) => {
    let obj = {};
    obj[key] = values[i];

    keyValueObjects.push(obj);
  });

  return keyValueObjects;
}
