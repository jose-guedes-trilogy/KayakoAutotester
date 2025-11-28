import { A } from '@ember/array';
import EmberObject from '@ember/object';
import { getOwner } from '@ember/application';
import { moduleForComponent, test } from 'frontend-cp/tests/helpers/qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('ko-bulk-invitation', 'Integration | Component | ko bulk invitation', {
  integration: true,

  beforeEach() {
    let intlService = getOwner(this).lookup('service:intl');
    intlService.setLocale('en-us');
    intlService.addTranslations('en-us', {
      generic: {
        select_placeholder: 'Select'
      },
      admin: {
        staff: {
          bulk_invitation: {
            fields: {
              name: { label: 'Name' },
              email: { label: 'Email' },
              role: { label: 'Role', placeholder: 'Choose a role' },
              teams: { label: 'Teams' }
            },
            buttons: {
              add_team_member: { label: 'Add team member' }
            }
          }
        }
      }
    });
  }
});

test('Adding recipients', function(assert) {
  assert.expect(5);

  let invitation = EmberObject.create({
    users: A([])
  });
  this.set('invitation', invitation);

  this.render(hbs`{{ko-bulk-invitation invitation=invitation}}`);

  assert.equal(this.$('.qa-recipient-row').length, 1, 'Start with one recipient row');

  fillIn('.qa-recipient-row:eq(0) .qa-fullname input', 'Bob');
  fillIn('.qa-recipient-row:eq(0) .qa-email input', 'a@a.com');

  this.$('.qa-add-recipient').click();
  this.$('.qa-add-recipient').click();
  this.$('.qa-add-recipient').click();

  assert.equal(this.$('.qa-recipient-row').length, 4, 'Add three recipient rows');
  assert.equal(invitation.get('users.length'), 4, 'Recipients added to invitation model');
  assert.equal(invitation.get('users.firstObject.fullname'), 'Bob', 'Fullname set');
  assert.equal(invitation.get('users.firstObject.email'), 'a@a.com', 'Email set');
});

test('Removing recipients', function(assert) {
  assert.expect(5);

  let invitation = EmberObject.create({
    users: A([])
  });
  this.set('invitation', invitation);

  this.render(hbs`{{ko-bulk-invitation invitation=invitation}}`);

  assert.equal(this.$('.qa-recipient-row').length, 1, 'Start with one recipient row');

  this.$('.qa-add-recipient').click();
  this.$('.qa-add-recipient').click();
  this.$('.qa-add-recipient').click();

  assert.equal(this.$('.qa-recipient-row').length, 4, 'Add three recipient rows');
  assert.equal(invitation.get('users.length'), 4, 'Recipients added to invitation model');

  this.$('.qa-recipient-row:eq(2) .qa-remove-recipient').click();
  this.$('.qa-recipient-row:eq(1) .qa-remove-recipient').click();

  assert.equal(this.$('.qa-recipient-row').length, 2, 'Two rows removed');
  assert.equal(invitation.get('users.length'), 2, 'Two recipients removed from model');
});

function fillIn(inputElement, value) {
  $(inputElement).val(value);
  $(inputElement).trigger('input');
}
