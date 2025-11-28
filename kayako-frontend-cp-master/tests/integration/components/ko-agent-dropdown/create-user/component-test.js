/* eslint-disable camelcase */
import { Promise as EmberPromise } from 'rsvp';

import EmberObject from '@ember/object';
import $ from 'jquery';
import { run, later } from '@ember/runloop';
import { getOwner } from '@ember/application';
import { moduleForComponent, test } from 'frontend-cp/tests/helpers/qunit';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';

import formButtonsStyles from 'frontend-cp/components/ko-form/buttons/styles';
import agentDropdownLayoutStyles from 'frontend-cp/components/ko-agent-dropdown/layout/styles';
import agentDropdownCreateUserStyles from 'frontend-cp/components/ko-agent-dropdown/create-user/styles';

moduleForComponent('ko-agent-dropdown/create-user', 'Integration | Component | ko agent dropdown/create user', {
  integration: true,
  beforeEach() {
    let intlService = getOwner(this).lookup('service:intl');
    intlService.setLocale('en-us');
    intlService.addTranslations('en-us', {
      generic: {
        validation_errors: 'validation_errors',
        cancel: 'Cancel',
        create_user_panel: {
          name_label: 'Name label',
          email_label: 'Email label',
          submit: 'Submit',
          info: 'Info',
          name_required: 'name_required',
          email_required: 'email_required',
          email_invalid: 'email_invalid'
        }
      }
    });

    let mockStore = createMockStore();
    this.registry.unregister('service:store');
    this.registry.register('service:store', mockStore, { instantiate: false });
  }
});

test('it renders', function(assert) {
  assert.expect(9);

  this.render(hbs`{{ko-agent-dropdown/create-user}}`);

  let $formElement = this.$('form');

  let $nameInputElement = getFormInput($formElement, 'full_name');
  let $emailInputElement = getFormInput($formElement, 'email');
  let $cancelButtonElement = $formElement.find('.qa-agent-dropdown-create-user__cancel');
  let $submitButtonElement = $formElement.find('.qa-agent-dropdown-create-user__submit');

  let $infoElement = this.$(`.${agentDropdownLayoutStyles.footer}`);

  let $nameLabelElement = $nameInputElement.closest('div');
  let $emailLabelElement = $emailInputElement.closest('div');

  assert.equal($nameLabelElement.text().trim(), 'Name label');
  assert.equal($nameInputElement.val(), '');
  assert.equal($nameInputElement.prop('placeholder'), '');

  assert.equal($emailLabelElement.text().trim(), 'Email label');
  assert.equal($emailInputElement.val(), '');
  assert.equal($nameInputElement.prop('placeholder'), '');

  assert.equal($submitButtonElement.text().trim(), 'Submit');
  assert.equal($cancelButtonElement.text().trim(), 'Cancel');

  assert.equal($infoElement.text().trim(), 'Info');
});

test('it validates the form fields before allowing submit', function(assert) {
  assert.expect(19);

  this.render(hbs`{{ko-agent-dropdown/create-user}}`);

  let $formElement = this.$('form');

  let $nameInputElement = getFormInput($formElement, 'full_name');
  let $emailInputElement = getFormInput($formElement, 'email');

  let nameErrors = getFieldErrors($formElement, 'full_name');
  let emailErrors = getFieldErrors($formElement, 'email');
  assert.deepEqual(nameErrors, []);
  assert.deepEqual(emailErrors, []);

  run(() => {
    $nameInputElement.focusin();
    $nameInputElement.focusout();
  });

  nameErrors = getFieldErrors($formElement, 'full_name');
  emailErrors = getFieldErrors($formElement, 'email');
  assert.deepEqual(nameErrors, []);
  assert.deepEqual(emailErrors, []);

  run(() => {
    $emailInputElement.focusin();
    $emailInputElement.focusout();
  });
  nameErrors = getFieldErrors($formElement, 'full_name');
  emailErrors = getFieldErrors($formElement, 'email');
  assert.deepEqual(nameErrors, []);
  assert.deepEqual(emailErrors, []);

  run(() => {
    fillIn($nameInputElement, 'Tim Kendrick');
  });
  nameErrors = getFieldErrors($formElement, 'full_name');
  emailErrors = getFieldErrors($formElement, 'email');
  assert.deepEqual(nameErrors, []);
  assert.deepEqual(emailErrors, []);
  run(() => {
    fillIn($emailInputElement, 'tim.kendrick@kayako');
    $emailInputElement[0].dispatchEvent(new Event('input'));
    $emailInputElement.blur();
  });
  emailErrors = getFieldErrors($formElement, 'email');
  assert.deepEqual(emailErrors, ['email_invalid']);

  run(() => {
    fillIn($nameInputElement, 'Tim Kendrick');
    fillIn($emailInputElement, 'tim.kendrick@kayako.com');
    $nameInputElement[0].dispatchEvent(new Event('input'));
    $emailInputElement[0].dispatchEvent(new Event('input'));
  });
  nameErrors = getFieldErrors($formElement, 'full_name');
  emailErrors = getFieldErrors($formElement, 'email');
  assert.deepEqual(nameErrors, []);
  assert.deepEqual(emailErrors, []);

  run(() => {
    fillIn($nameInputElement, '');
    $nameInputElement[0].dispatchEvent(new Event('input'));
  });
  nameErrors = getFieldErrors($formElement, 'full_name');
  emailErrors = getFieldErrors($formElement, 'email');
  assert.deepEqual(nameErrors, []);
  assert.deepEqual(emailErrors, []);

  run(() => {
    fillIn($nameInputElement, 'Tim Kendrick');
    $nameInputElement[0].dispatchEvent(new Event('input'));
  });
  nameErrors = getFieldErrors($formElement, 'full_name');
  emailErrors = getFieldErrors($formElement, 'email');
  assert.deepEqual(nameErrors, []);
  assert.deepEqual(emailErrors, []);

  run(() => {
    fillIn($emailInputElement, '');
    $emailInputElement[0].dispatchEvent(new Event('input'));
  });
  nameErrors = getFieldErrors($formElement, 'full_name');
  emailErrors = getFieldErrors($formElement, 'email');
  assert.deepEqual(nameErrors, []);
  assert.deepEqual(emailErrors, []);

  run(() => {
    fillIn($emailInputElement, 'tim.kendrick@kayako.com');
    $emailInputElement[0].dispatchEvent(new Event('input'));
  });
  nameErrors = getFieldErrors($formElement, 'full_name');
  emailErrors = getFieldErrors($formElement, 'email');
  assert.deepEqual(nameErrors, []);
  assert.deepEqual(emailErrors, []);
});

test('it submits the form', function(assert) {
  assert.expect(17);
  let done = assert.async();

  this.dropdown = { actions: { close() { } } };
  let onCreate = sinon.spy();
  let onCancel = sinon.spy();

  this.on('onCancel', onCancel);
  this.on('onCreate', onCreate);

  this.render(hbs`{{ko-agent-dropdown/create-user
      dropdown=dropdown
      onCreate=(action "onCreate")
      onCancel=(action "onCancel")
  }}`);

  let $formElement = this.$('form');

  let $nameInputElement = getFormInput($formElement, 'full_name');
  let $emailInputElement = getFormInput($formElement, 'email');
  let $cancelButtonElement = $formElement.find('.qa-agent-dropdown-create-user__cancel');
  let $loaderElement = $formElement.find('.' + formButtonsStyles.loader);

  assert.equal($formElement.hasClass('ko-form--is-submitting'), false);
  assert.equal($cancelButtonElement.length, 1);
  assert.equal($loaderElement.length, 0);

  fillIn($nameInputElement, 'Tim Kendrick');
  fillIn($emailInputElement, 'tim.kendrick@kayako.com');
  $nameInputElement[0].dispatchEvent(new Event('input'));
  $emailInputElement[0].dispatchEvent(new Event('input'));
  run(() => {
    $formElement.submit();
  });

  run(() => {
    let $cancelButtonElement = $formElement.find('.qa-agent-dropdown-create-user__cancel');
    let $loaderElement = $formElement.find('.' + formButtonsStyles.loader);

    assert.equal($formElement.hasClass('ko-form--is-submitting'), true);
    assert.equal($cancelButtonElement.length, 0);
    assert.equal($loaderElement.length, 1);

    assert.equal(onCreate.callCount, 0);
    assert.equal(onCancel.callCount, 0);
  });


  later(() => {
    let $cancelButtonElement = $formElement.find('.qa-agent-dropdown-create-user__cancel');
    let $loaderElement = $formElement.find('.' + formButtonsStyles.loader);

    assert.equal($formElement.hasClass('ko-form--is-submitting'), false);
    assert.equal($cancelButtonElement.length, 1);
    assert.equal($loaderElement.length, 0);

    let mockStore = getOwner(this).lookup('service:store');
    assert.ok(mockStore.createRecord.calledTwice);
    assert.ok(mockStore.createRecord.calledWith('identity-email', {
      isPrimary: true,
      email: 'tim.kendrick@kayako.com'
    }));
    assert.equal(mockStore.createRecord.secondCall.args[0], 'user');
    assert.propertiesEqual(mockStore.createRecord.secondCall.args[1], {
      fullName: 'Tim Kendrick',
      emails: [
        {
          email: 'tim.kendrick@kayako.com',
          isPrimary: true
        }
      ],
      role: {
        id: 4 // Users are created as CUSTOMERs
      }
    });

    assert.ok(onCreate.calledOnce);
    assert.propertiesEqual(onCreate.firstCall.args[0], {
      fullName: 'Tim Kendrick',
      emails: [
        {
          email: 'tim.kendrick@kayako.com',
          isPrimary: true
        }
      ],
      role: {
        id: 4
      }
    });

    done();
  }, 100); // Delay due to inaccurate `createMockStore` behaviour (see below)
});

test('it emits an onCancel event', function(assert) {
  assert.expect(1);

  let onCancel = sinon.spy();

  this.on('onCancel', onCancel);

  this.render(hbs`{{ko-agent-dropdown/create-user
      onCancel=(action "onCancel")
  }}`);

  let $formElement = this.$('form');
  let $cancelButtonElement = $formElement.find('.qa-agent-dropdown-create-user__cancel');

  run(() => {
    $cancelButtonElement.click();
  });

  assert.equal(onCancel.callCount, 1);
});


function getFormInput(formElement, controlName) {
  return $(formElement).find(`.qa-agent-dropdown_create-user__${controlName}`);
}

function fillIn(inputElement, value) {
  $(inputElement).val(value).change();
}

function getFieldErrors(formElement, inputName) {
  let $errorElements = $(formElement).find(`.qa-agent-dropdown_create-user__${inputName} + .${agentDropdownCreateUserStyles.error}`);
  return $errorElements.map((index, element) => $(element).text().trim()).get();
}

function createMockStore(records) {
  records = records || {};
  let store = {
    findRecord: sinon.spy(function(typeName, id) {
      let record = EmberObject.create({
        id: id
      });
      return EmberPromise.resolve(record);
    }),
    createRecord: sinon.spy(function(typeName, fields) {
      if (typeName === 'user') { fields = Object.assign({ emails: [] }, fields); }
      let record = EmberObject.extend({
        save: sinon.spy(function() {
          // FIXME: This sequence doesn't quite accurately reflect the
          // store's async behaviour (this is why the delay is necessary
          // in the async tests)
          let hasErrors = Object.keys(fields).some(key => fields[key] === 'ERROR');
          return new EmberPromise((resolve, reject) => {
            setTimeout(() => {
              if (hasErrors) {
                reject({
                  errors: []
                });
              } else {
                resolve(record);
              }
            });
          });
        })
      }).create(fields);
      return record;
    })
  };
  return store;
}
