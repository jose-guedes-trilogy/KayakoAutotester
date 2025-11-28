import { Promise as EmberPromise } from 'rsvp';
import Service, { inject as service } from '@ember/service';

export default Service.extend({
  i18n: service(),
  activeConfirmation: null,
  confirmationPromise: null,

  /* Store functions to accept/reject current confirmation promise */
  _acceptConfirmation: null,
  _rejectConfirmation: null,

  confirm({
    intlConfirmationHeader,
    intlConfirmationBody,
    intlConfirmLabel = 'generic.confirm_button',
    intlCancelLabel = 'generic.cancel',
    isIntl = false,
    confirmButtonType = 'primary'
  }) {

    if (isIntl) {
      this.set('activeConfirmation', {
        text: intlConfirmationBody,
        header: intlConfirmationHeader ? intlConfirmationHeader : null,
        confirmLabel: intlConfirmLabel,
        cancelLabel: this.get('i18n').t(intlCancelLabel)
      });
    }
    else {
      this.set('activeConfirmation', {
        text: this.get('i18n').t(intlConfirmationBody),
        header: intlConfirmationHeader ? this.get('i18n').t(intlConfirmationHeader) : null,
        confirmLabel: this.get('i18n').t(intlConfirmLabel),
        cancelLabel: this.get('i18n').t(intlCancelLabel)
      });
    }

    this.set('activeConfirmation.confirmButtonType', confirmButtonType);

    return new EmberPromise((accept, cancel) => {
      this.set('_acceptConfirmation', accept);
      this.set('_rejectConfirmation', cancel);
    }).finally(() => {
      this.set('activeConfirmation', null);
      this.set('_acceptConfirmation', null);
      this.set('_rejectConfirmation', null);
    });
  },

  cancelConfirmation() {
    this.get('_rejectConfirmation')(false);
  },

  acceptConfirmation() {
    this.get('_acceptConfirmation')(true);
  }
});
