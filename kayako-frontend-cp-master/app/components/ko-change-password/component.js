import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';

export default Component.extend({
	store: service(),
	notification: service('notification'),
  i18n: service(),

	currentPassword: null,
	newPassword: null,
	confirmPassword: null,

	agentPasswordFields: {
		'agent.password.min_characters': function (value, expectedLength) {
			return value && value.length >= expectedLength;
		},
		'agent.password.min_numbers': function (value, expectedLength) {
			return new RegExp(`\\d{${expectedLength}}`).test(value);
		},
		'agent.password.min_symbols': function (value, expectedLength) {
			return new RegExp(`[$-/:-?{-~!"^_@#\`]{${expectedLength}}`).test(value);
		},
		'agent.password.require_mixed_case': function (value, expectedLength) {
			return new RegExp(`[A-Z]{${expectedLength}}`).test(value);
		},
    'agent.password.max_consecutive': function (value, expectedLength) {
			return !(new RegExp(`(.)\\1{${expectedLength - 1}}\\1`).test(value));
		}
	},

	buttonDisabled: computed('currentPassword', 'confirmPassword', 'policies', function() {
    const policiesMet = this.get('policies').isEvery('passes');
		return !(this.get('currentPassword') && this.get('confirmPassword') && policiesMet);
	}),

	policies: computed('newPassword', function () {
		const password = this.get('newPassword');

		let settings = this.get('store').peekAll('setting');

		const passwordChecksFields = Object.keys(this.get('agentPasswordFields'));
		return settings
		.filter((setting) => {
			return passwordChecksFields.includes(setting.get('name')) && Number(setting.get('value'));
		})
		.map((setting) => {
			return {
				value: setting.get('value'),
				name: setting.get('name').replace('agent.password', 'users.change_password.policies'),
				passes: this.get('agentPasswordFields')[setting.get('name')](password, Number(setting.get('value')))
			};
		});
	}),

	save: task(function * (e) {
    e.preventDefault();
    const currentPassword = this.get('currentPassword');
    const newPassword = this.get('newPassword');
    const confirmPassword = this.get('confirmPassword');

    // Do not proceed if new & confirm passwords do not match
    if (!newPassword || newPassword !== confirmPassword) {
      this.get('notification').add({
        type: 'error',
        title: this.get('i18n').t('users.change_password.message.dont_match'),
        autodismiss: true
      });
      return;
    }

		yield this.get('store')
      .adapterFor('user')
      .changePassword(currentPassword, newPassword);

    this.get('notification').add({
      type: 'success',
      title: this.get('i18n').t('users.change_password.message.success'),
      autodismiss: true
    });

    // Close the modal
    this.get('onClose')();
	}).drop()
});
