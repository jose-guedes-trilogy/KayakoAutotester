import { moduleFor, test } from 'ember-qunit';
import { normalizeToImprovedContract } from 'frontend-cp/serializers/definition-improved-contract';

moduleFor('serializer:definition-improved-contract', 'Unit | Serializer | Definition Improved Contract');

const simpleExample = {
  data: [
    {
      field: 'users.fullname',
      group: '',
      input_type: 'STRING',
      label: 'Name',
      operators: [
        'string_contains_insensitive',
        'comparison_equalto'
      ],
      resource_type: 'definition',
      sub_type: '',
      type: 'STRING',
      values: ['A', 'B']
    }
  ]
};

test('payload is normalizied into the improved contract', function(assert) {
  assert.deepEqual(
    normalizeToImprovedContract(simpleExample),
    {
      data: [
        {
          attributes: {
            label: 'Name'
          },
          id: 'users.fullname',
          relationships: {
            operators: {
              data: [
                {
                  id: 'name_string_contains_insensitive',
                  type: 'definition_improved_contract_operator'
                },
                {
                  id: 'name_comparison_equalto',
                  type: 'definition_improved_contract_operator'
                }
              ]
            }
          },
          type: 'definition_improved_contract'
        }
      ],
      included: [
        {
          attributes: {
            label: 'string_contains_insensitive',
            originalFieldName: 'users.fullname'
          },
          id: 'name_string_contains_insensitive',
          relationships: {
            input: {
              data: {
                id: 'users.fullname',
                type: 'definition_improved_contract_input'
              }
            }
          },
          type: 'definition_improved_contract_operator'
        },
        {
          attributes: {
            label: 'comparison_equalto',
            originalFieldName: 'users.fullname'
          },
          id: 'name_comparison_equalto',
          relationships: {
            input: {
              data: {
                id: 'users.fullname',
                type: 'definition_improved_contract_input'
              }
            }
          },
          type: 'definition_improved_contract_operator'
        },
        {
          attributes: {
            inputType: 'STRING',
            values: [
              {0: 'A'},
              {1: 'B'}
            ]
          },
          id: 'users.fullname',
          type: 'definition_improved_contract_input'
        },
      ],
    },
    'payload is normalized into the improved contract'
  );
});

const differentFieldTypesPerOperatorExample = {
  data: [
    {
      field: 'users.createdat_relative_past',
      group: 'DATE',
      input_type: 'DATE_RELATIVE',
      label: 'Created at',
      operators: [
        'date_before_or_on'
      ],
      resource_type: 'definition',
      sub_type: 'PAST_OR_PRESENT',
      type: 'DATE_RELATIVE',
      values: {
        currentmonth: 'currentmonth',
        yesterday: 'yesterday'
      }
    },
    {
      field: 'users.createdat_absolute',
      group: 'DATE',
      input_type: 'DATE_ABSOLUTE',
      label: 'Created at',
      operators: [
        'date_is',
        'date_is_not'
      ],
      resource_type: 'definition',
      sub_type: '',
      type: 'DATE_ABSOLUTE'
    }
  ]
};

test('payload with date relative and date absolute is normalizied into the improved contract using the label to coalesce', function(assert) {
  assert.deepEqual(
    normalizeToImprovedContract(differentFieldTypesPerOperatorExample),
    {
      data: [
        {
          attributes: {
            label: 'Created at'
          },
          id: 'users.createdat_relative_past',
          relationships: {
            operators: {
              data: [
                {
                  id: 'created_at_date_before_or_on',
                  type: 'definition_improved_contract_operator',
                },
                {
                  id: 'created_at_date_is',
                  type: 'definition_improved_contract_operator',
                },
                {
                  id: 'created_at_date_is_not',
                  type: 'definition_improved_contract_operator',
                }
              ],
            },
          },
          type: 'definition_improved_contract'
        }
      ],
      included: [
          {
            attributes: {
              label: 'date_before_or_on',
              originalFieldName: 'users.createdat_relative_past'
            },
            id: 'created_at_date_before_or_on',
            relationships: {
              input: {
                data: {
                  id: 'users.createdat_relative_past',
                  type: 'definition_improved_contract_input'
                }
              },
            },
            type: 'definition_improved_contract_operator',
          },
          {
            attributes: {
              label: 'date_is',
              originalFieldName: 'users.createdat_absolute'
            },
            id: 'created_at_date_is',
            relationships: {
              input: {
                data: {
                  id: 'users.createdat_absolute',
                  type: 'definition_improved_contract_input'
                }
              },
            },
            type: 'definition_improved_contract_operator',
          },
          {
            attributes: {
              label: 'date_is_not',
              originalFieldName: 'users.createdat_absolute'
            },
            id: 'created_at_date_is_not',
            relationships: {
              input: {
                data: {
                  id: 'users.createdat_absolute',
                  type: 'definition_improved_contract_input'
                }
              },
            },
            type: 'definition_improved_contract_operator',
          },
          {
            attributes: {
              inputType: 'DATE_RELATIVE',
              values: [
                {
                  currentmonth: 'currentmonth'
                },
                {
                  yesterday: 'yesterday'
                }
              ]
            },
            id: 'users.createdat_relative_past',
            type: 'definition_improved_contract_input',
          },
          {
            attributes: {
              inputType: 'DATE_ABSOLUTE',
              values: undefined
            },
            id: 'users.createdat_absolute',
            type: 'definition_improved_contract_input',
          }
      ]
    },
    'payload is normalized into the improved contract with the two date fields normalized into one'
  );
});
