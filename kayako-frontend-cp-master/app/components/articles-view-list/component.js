import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import diffAttrs from 'ember-diff-attrs';
import { Promise } from 'rsvp';
import { INITIAL_FILTER } from '../article-filters-panel/component';
import _ from 'npm:lodash';

export default Component.extend({
  store: service(),
  router: service(),
  confirmation: service(),
  i18n: service(),
  notification: service(),
  locale: service(),
  session: service(),
  articleEvents: service(),

  articles: [],
  currentPage: 1,
  itemsPerPage: 15,
  totalCount: 0,
  loadingPage: -1,
  isLoading: false,
  selectedArticleIds: [],
  allRowsSelected: false,
  isDeletingArticles: false,
  showFilters: false,
  selectedStatus: 'ALL',
  filters: [],
  isHidden: false,
  previousStatus: null,
  initialFilters: [_.clone(INITIAL_FILTER)],

  init() {
    this._super(...arguments);
    this.set('previousStatus', this.get('selectedStatus'));
    this.fetchArticlesForPage(this.currentPage);
  },

  // Task to handle both visibility and status changes in a coordinated way
  handleExternalChanges: task(function* () {
    // Wait a moment to allow properties to settle in case they change close together
    yield new Promise(resolve => setTimeout(resolve, 10));

    let hidden = this.get('isHidden');
    let status = this.get('selectedStatus');
    let previousStatus = this.get('previousStatus');

    // Check if the status has actually changed
    if (status !== previousStatus) {
      const statusFilter = this.generateFilterFromStatus(status);
      this.set('currentPage', 1);
      this.set('filters', statusFilter);
      this.set('previousStatus', status);
    }

    // Check if the component is now visible
    if (!hidden) {
      yield this.fetchArticlesForPage(this.get('currentPage'));
    }
  }).restartable(),


  didReceiveAttrs: diffAttrs('isHidden', 'selectedStatus', function(changedAttrs, ...args) {
    this._super(...arguments);
    if (changedAttrs && !(changedAttrs.isHidden || changedAttrs.selectedStatus)) {
      return;
    }

    this.get('handleExternalChanges').perform();
  }),

  generateFilterFromStatus(status) {
    const currentUser = this.get('session.user');

    let filters = [_.clone(INITIAL_FILTER)];

    switch (status) {
      case 'PUBLISHED':
        filters = [
          { key: 'status', operator: 'equals', value: 'PUBLISHED' },
          { key: 'author', operator: 'equals', value: currentUser.get('fullName') }
        ];
        break;
      case 'DRAFT':
        filters = [{ key: 'status', operator: 'equals', value: 'DRAFT' }];
        break;
      case 'ALL':
      default:
        break;
    }

    this.set('initialFilters', _.cloneDeep(filters));
    return filters;
  },

  totalPages: computed('totalCount', 'itemsPerPage', function() {
    return Math.ceil(this.get('totalCount') / this.get('itemsPerPage'));
  }),

  // Computed property to determine which pages to display for pagination
  visiblePages: computed('currentPage', 'totalPages', function() {
    const totalPages = this.get('totalPages');
    const currentPage = this.get('currentPage');
    const maxPages = 9;
    let startPage, endPage;

    if (totalPages <= maxPages) {
      // Total pages less than max, so show all pages
      startPage = 1;
      endPage = totalPages;
    } else {
      // More than max pages, so calculate start and end pages
      let middle = Math.floor(maxPages / 2);
      if (currentPage <= middle) {
        startPage = 1;
        endPage = maxPages;
      } else if (currentPage + middle >= totalPages) {
        startPage = totalPages - maxPages + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - middle;
        endPage = currentPage + middle;
      }
    }
    return Array.from({ length: (endPage - startPage + 1) }, (_, i) => startPage + i);
  }),

  async fetchArticlesForPage(page) {
    try {
      this.set('isLoading', true);
      this.set('loadingPage', page);
      const limit = this.get('itemsPerPage');
      const offset = (page - 1) * limit;
      const store = this.get('store');
      const articleAdapter = store.adapterFor('article');
      const result = await articleAdapter.fetchArticles({ offset, limit, filters: this.get('filters') });
      const defaultLocale = this.get('locale.accountDefaultLocaleCode');
      const userLocale = this.get('session.user.locale.locale');
      result.data.forEach(a => {
        let titleObj = a.titles.find(t => t.locale === defaultLocale) ||
                       a.titles.find(t => t.locale === userLocale) ||
                       a.titles[0];
        a.title = titleObj.translation;

        let sectionObj = a.sections.find(s => s.locale === defaultLocale) ||
                         a.sections.find(s => s.locale === userLocale) ||
                         a.sections[0];
        a.section = sectionObj.translation;

        let categoryObj = a.categories.find(c => c.locale === defaultLocale) ||
                          a.categories.find(c => c.locale === userLocale) ||
                          a.categories[0];
        a.category = categoryObj.translation;
      });
      this.set('isDeletingArticles', false);
      this.set('selectedArticleIds', []);
      this.set('articles', result.data);
      this.set('totalCount', result.totalCount);
      this.set('loadingPage', -1);
      this.set('currentPage', page);
    } catch (error) {
      this.get('notification').error(this.get('i18n').t('admin.knowledgebase.errors.fetch_articles'));
    } finally {
      this.set('isLoading', false);
    }
  },

  trashArticles: task(function * () {
    return yield this.get('confirmation').confirm({
      intlConfirmationBody: 'admin.knowledgebase.trasharticles.confirmation'
    }).then(() => {
      this.set('isDeletingArticles', true);
      this.set('isLoading', true);
      const store = this.get('store');
      const articleAdapter = store.adapterFor('article');
      return articleAdapter.deleteByIds(this.get('selectedArticleIds').join(',')).then(() => {
        const selectedArticleIdsCount = this.get('selectedArticleIds').length;
        const articlesCount = this.get('articles').length;
        const currentPage = this.get('currentPage');
        this.set('allRowsSelected', false);
        this.set('isLoading', false);
        if (selectedArticleIdsCount === articlesCount && currentPage > 1) {
          this.fetchArticlesForPage(currentPage - 1);
        } else {
          this.fetchArticlesForPage(currentPage);
        }
        this.get('articleEvents').articleDeleted();
      }).catch(() => {
        this.get('notification').error(this.get('i18n').t('admin.knowledgebase.trasharticles.failed'));
        this.set('isLoading', false);
        this.set('isDeletingArticles', false);
      });
    });
  }),

  actions: {
    previousPage() {
      if (this.get('currentPage') > 1) {
        const previousPage = this.get('currentPage') - 1;
        this.fetchArticlesForPage(previousPage);
      }
    },
    firstPage() {
      if (this.get('currentPage') === 1) {
        return;
      }
      this.fetchArticlesForPage(1);
    },
    goToPage(page) {
      if (page === this.get('currentPage')) {
        return;
      }
      this.fetchArticlesForPage(page);
    },
    nextPage() {
      if (this.get('currentPage') < this.get('totalPages')) {
        const nextPage = this.get('currentPage') + 1;
        this.fetchArticlesForPage(nextPage);
      }
    },
    goToLastPage() {
      if (this.get('currentPage') === this.get('totalPages')) {
        return;
      }
      const lastPage = this.get('totalPages');
      this.fetchArticlesForPage(lastPage);
    },
    async openArticle(articleId) {
      if (this.get('isLoading')) {
        return;
      }
      this.set('isLoading', true);
      await this.get('router').transitionTo('session.agent.knowledgebase.article-view', articleId);
      this.set('isLoading', false);
    },
    handleAllRowsSelection(value) {
      if (value) {
        this.set('allRowsSelected', true);
        this.set('selectedArticleIds', this.get('articles').mapBy('id'));
      } else {
        this.set('allRowsSelected', false);
        this.set('selectedArticleIds', []);
      }
    },
    handleRowSelection(articleId, value) {
      const selectedArticleIds = [...this.get('selectedArticleIds')];
      if (value) {
        selectedArticleIds.push(articleId);
      } else {
        selectedArticleIds.removeObject(articleId);
      }
      this.set('selectedArticleIds', selectedArticleIds);
    },
    handleApplyFilters: function(filters, reset) {
      // Handle the filters passed back from the child component
      this.set('currentPage', 1);
      this.set('filters', filters);
      this.fetchArticlesForPage(this.get('currentPage'));
      this.set('showFilters', false);
    }
  }
});
