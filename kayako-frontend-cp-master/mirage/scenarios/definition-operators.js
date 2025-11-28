export function operatorsForInputTypeIntegerOrFloat(){
  return [
    'comparison_equalto',
    'comparison_not_equalto',
    'comparison_greaterthan',
    'comparison_greaterthan_or_equalto',
    'comparison_lessthan',
    'comparison_lessthan_or_equalto'
  ];
}

export function operatorsForInputTypeString(){
  return [
    'string_contains_insensitive',
    'comparison_equalto'
  ];
}

export function operatorsForInputTypeStringExact(){
  return [
    'is'
  ];
}

export function operatorsForInputTypeBooleanOrOptionsOrAutocomplete(){
  return [
    'comparison_equalto',
    'comparison_not_equalto'
  ];
}

export function operatorsForInputTypeBooleanTrueOrFalse() {
  return [
    'comparison_equalto'
  ];
}

export function operatorsForInputTypeBooleanTrue() {
  return [
    'is'
  ];
}

export function operatorsForInputTypeTags() {
  return [
    'collection_contains_insensitive',
    'collection_contains_any_insensitive'
  ];
}

export function operatorsForInputTypeTime() {
  return [
    'time_greaterthan',
    'time_greaterthan_or_equalto',
    'time_lessthan',
    'time_lessthan_or_equalto'
  ];
}

export function operatorsForInputTypeDateAbsolute() {
  return [
    'date_is',
    'date_is_not'
  ];
}

export function operatorsForInputTypeDateRelativeBefore() {
  return [
    'date_before',
    'date_before_or_on'
  ];
}

export function operatorsForInputTypeDateRelativeAfter() {
  return [
    'date_after',
    'date_after_or_on'
  ];
}

export function operatorsForInputTypeMultiple () {
  return [
    'contains_one_of_the_following',
    'contains_none_of_the_following',
    'contains_all_of_the_following'
  ];
}

export function operatorsForInputTypeOptions() {
  return [
    'is',
    'is_not'
  ];
}
