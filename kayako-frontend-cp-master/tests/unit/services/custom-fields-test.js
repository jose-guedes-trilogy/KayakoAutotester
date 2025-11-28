import { Promise as EmberPromise } from 'rsvp';
import { run } from '@ember/runloop';
import { getOwner } from '@ember/application';
import { moduleFor, test } from 'ember-qunit';

moduleFor('service:custom-fields', 'Unit | Service | custom-fields', {
  integration: true,

  beforeEach() {
    const intl = getOwner(this).lookup('service:intl');

    intl.setLocale('en-us');
    intl.addTranslations('en-us', {
      admin: {
        userfields: { title: 'userfields' },
        fields: {
          new: { heading: 'New field' },
          edit: { heading: 'Edit field' },
          type: { field_options: { missing_options: 'missing_options' } }
        },
        casefields: {
          type: { dropdown: { name: 'Dropdown' } }
        }
      }
    });
  }
});

test('it renders correct title breadcrumbs for new record', function (assert) {
  assert.expect(1);

  const service = this.subject();
  const store = getOwner(this).lookup('service:store');

  let model;
  run(() => {
    model = store.createRecord('user-field', {
      fieldType: 'SELECT',
      options: []
    });
  });

  assert.equal(
    service.getTitleBreadcrumbs(model),
    'userfields / Dropdown / New field'
  );
});

test('it renders correct title breadcrumbs for existed record', function (assert) {
  assert.expect(1);

  let store = getOwner(this).lookup('service:store');

  let model;
  run(() => {
    model = store.push({
      data: {
        id: 1,
        type: 'user-field',
        attributes: {
          title: 'Test Select',
          fieldType: 'SELECT',
          options: []
        }
      }
    });
  });
  let service = this.subject();

  assert.equal(
    service.getTitleBreadcrumbs(model),
    'userfields / Test Select'
  );
});

test('it populates new records with data through ensureLocaleFieldsAndOptions method', function (assert) {
  assert.expect(4);

  const service = this.subject();
  const store = getOwner(this).lookup('service:store');


  let userField;
  run(() => {
    userField = store.createRecord('user-field', {
      fieldType: 'SELECT',
      options: []
    });
  });

  run(() => {
    store.createRecord('locale', {
      locale: 'en-us',
      isPublic: true
    });

    store.createRecord('locale', {
      locale: 'fr',
      isPublic: true
    });

    store.createRecord('locale', {
      locale: 'de',
      isPublic: true
    });
  });

  run(() => {
    service.ensureLocaleFieldsAndOptions(userField);
  });

  assert.equal(userField.get('customerTitles').length, 3);
  assert.equal(userField.get('descriptions').length, 3);
  assert.equal(userField.get('options').length, 1);
  assert.equal(userField.get('options.firstObject.values.length'), 3);
});

test('it persist new record through save method', function (assert) {
  assert.expect(1);

  const service = this.subject();
  const store = getOwner(this).lookup('service:store');

  service.reopen({
    save(model) {
      assert.equal(model.get('isNew'), true);
    }
  });

  let model;
  run(() => {
    model = store.createRecord('user-field', {
      fieldType: 'SELECT',
      options: []
    });
  });

  service.save(model);
});

test('it can toggle enabled state on the record', function (assert) {
  assert.expect(3);

  const service = this.subject();
  const store = getOwner(this).lookup('service:store');

  let model;

  run(() => {
    model = store.createRecord('user-field', {
      fieldType: 'SELECT',
      sortOrder: 1,
      options: []
    });
  });

  model.reopen({
    save() {
      return new EmberPromise(resolve => {
        // we need to check that save is called once
        assert.equal(true, true);
        return resolve();
      });
    }
  });

  assert.equal(model.get('isEnabled'), true);

  run(() => {
    service.toggleEnabled(model);
  });

  assert.equal(model.get('isEnabled'), false);
});
