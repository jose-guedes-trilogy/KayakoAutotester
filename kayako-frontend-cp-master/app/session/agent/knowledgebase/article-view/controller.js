import Controller from '@ember/controller';
import { copy } from '@ember/object/internals';
import { set } from '@ember/object';
import { next } from '@ember/runloop';
import { computed } from '@ember/object';
import isInternalTag from '../../../../utils/is-internal-tag';

export default Controller.extend({
  isEditPaneOpen: false,
  isEditPaneVisible: false,
  articleToEdit: null,
  isArticleLoading: false,


  visibleTags: computed('model.article.tags.@each.name', function() {
    return this.get('model.article.tags').filter(tag => {
      return !isInternalTag(tag);
    });
  }),

  openEditArticlePane() {
    set(this, 'isEditPaneOpen', true);
    next(() => {
      set(this, 'isEditPaneVisible', true);
    });
  },

  closeEditArticlePane() {
    set(this, 'isEditPaneOpen', false);
    set(this, 'isEditPaneVisible', false);
  },

  stopPropagation(event) {
    event.stopPropagation();
  },

  actions: {
    openEditArticlePane() {
      this.set('articleToEdit', copy(this.get('model.article'), true));
      this.openEditArticlePane();
    },
    closeEditArticlePane() {
      this.closeEditArticlePane();
    },
    onArticleSave() {
      this.set('isArticleLoading', true);
      this.send('refreshRoute');
      this.closeEditArticlePane();
    },
    stopPropagation(event) {
      this.stopPropagation(event);
    }
  }
});
