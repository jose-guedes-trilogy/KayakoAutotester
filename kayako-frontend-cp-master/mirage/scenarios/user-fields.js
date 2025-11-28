import _ from 'npm:lodash';

export function createUserField(server) {
  return server.create('user-field');
}

export function createUserFields(server) {
  return _.range(5).map(() => createUserField(server));
}

export function createuserFieldValue(server, field) {
  return server.create('user-field-value', { field });
}

export function createUserFieldValues(server, userFields) {
  return userFields.map(field => createuserFieldValue(server, field));
}
