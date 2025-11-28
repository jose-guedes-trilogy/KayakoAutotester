import Mixin from '@ember/object/mixin';
import { inject as service } from '@ember/service';

export default (modelFieldName = null) => {
  return Mixin.create({
    i18n: service(),
    confirmation: service(),

    // Actions
    actions: {
      willTransition(transition) {
        let isEdited = this.controller.get('isEdited');

        if (typeof isEdited === 'function') {
          isEdited = Reflect.apply(isEdited, this.controller, []);
        }

        if (isEdited) {
          transition.abort();

          this.get('confirmation').confirm({
            intlConfirmationHeader: 'generic.confirm.lose_changes_header',
            intlConfirmationBody: 'generic.confirm.lose_changes',
            intlConfirmLabel: 'generic.confirm.lose_changes_button'
          }).then(() => {
            this.controller.initEdits();
            transition.retry();
          });
        } else if (modelFieldName) {
          const model = this.controller.get(modelFieldName);
          if (model.get('isNew')) {
            model.rollbackAttributes();
          }
        }
      }
    }
  });
};
