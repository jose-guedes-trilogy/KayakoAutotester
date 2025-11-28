import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { MACROS_LIMIT } from './route';
import { task } from 'ember-concurrency';

export default Controller.extend({
  queryParams: ['page'],
  page: 1,
  isLoadingMacros: false,
  model: null,

  i18n: service(),
  confirmation: service(),
  store: service(),

  totalPages: computed('model.meta.total', function() {
    const totalMacros = this.get('model.meta.total');
    return Math.ceil(totalMacros / MACROS_LIMIT);
  }),

  deleteAndRefreshMacrosList: task(function * (macro) {
    yield macro.destroyRecord();

    const page = this.get('page');
    let offset = (parseInt(page) - 1) * MACROS_LIMIT;
    const macros = yield this.get('store').query('macro', { show_all: true, offset, limit: MACROS_LIMIT });
    this.set('model', macros);
  }).restartable(),

  actions: {
    transitionToNewMacroRoute() {
      this.transitionToRoute('session.admin.automation.macros.new');
    },

    editMacro(macro) {
      this.transitionToRoute('session.admin.automation.macros.edit', macro.get('id'));
    },

    deleteMacro(macro, e) {
      e.stopPropagation();
      return this.get('confirmation').confirm({ intlConfirmationBody: 'generic.confirm.delete' })
        .then(() => this.get('deleteAndRefreshMacrosList').perform(macro));
    }
  }
});
