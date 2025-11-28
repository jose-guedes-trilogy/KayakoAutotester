import { helper } from '@ember/component/helper';
import { get } from '@ember/object';
import { dasherize } from '@ember/string';

const basicInputs = ['integer', 'float', 'string'];
const basicEndpointTypes = ['endpoint-slack', 'endpoint-email'];
const postEndpointTypes = ['endpoint-http-xml', 'endpoint-http-json'];
const booleanTypes = ['boolean'];
const booleanTrueTypes = ['boolean-true'];
const booleanFalseTypes = ['boolean-false'];
const notificationTypes = ['notification-user', 'notification-team'];

export function automationActionBuilderComponentName([automationActionDefinition]) {
  if (automationActionDefinition) {
    let inputType = dasherize(get(automationActionDefinition, 'inputType'));
    let componentName = inputType;
    if (basicInputs.indexOf(inputType) > -1 && automationActionDefinition.get('name') === 'send_message') {
      componentName = 'autocomplete-team-or-agent';
    } else if (basicInputs.indexOf(inputType) > -1) {
      componentName = 'input';
    }
    if (basicEndpointTypes.indexOf(inputType) > -1) {
      componentName = 'endpoint-basic';
    }
    if (postEndpointTypes.indexOf(inputType) > -1) {
      componentName = 'endpoint-http-post';
    }
    if (booleanTypes.indexOf(inputType) > -1) {
      componentName = 'boolean';
    }
    if (booleanTrueTypes.indexOf(inputType) > -1) {
      componentName = 'boolean-true';
    }
    if (booleanFalseTypes.indexOf(inputType) > -1) {
      componentName = 'boolean-false';
    }
    if (notificationTypes.indexOf(inputType) > -1) {
      componentName = 'notification';
    }
    if (inputType === 'autocomplete' && automationActionDefinition.get('name') === 'assignee') {
      componentName = 'autocomplete-agent';
    }
    return `ko-admin/automation-actions-builder/${componentName}`;
  }
}

export default helper(automationActionBuilderComponentName);
