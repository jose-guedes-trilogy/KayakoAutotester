import { readOnly } from '@ember/object/computed';
import { resolve } from 'rsvp';
import { computed } from '@ember/object';
import Service, { inject as service } from '@ember/service';
import { run } from '@ember/runloop';
import Ember from 'ember';
import _ from 'npm:lodash';
import config from 'frontend-cp/config/environment';
import { task, didCancel } from 'ember-concurrency';
import mapToFieldsAndIncludes from 'frontend-cp/lib/column-mappings/map-columns-to-fields-and-includes';

const CASE_VIEW_LIMIT = config.APP.views.maxLimit;
const CASE_PAGE_SIZE = config.casesPageSize;
const CASE_POLLING_TIME = config.APP.views.casesPollingInterval * 1000;

export default Service.extend({
  // Services
  store: service(),
  socket: service(),
  router: service('-routing'),
  permissions: service(),
  session: service(),

  // State
  views: null,
  latestCases: null,
  viewCounts: null,
  suspendedMailsCount: null,
  forceNextLoad: false,
  currentCachedView: null,
  currentCachedParams: null,
  currentView: null,
  currentParams: null,
  viewsCountPollingTimer: null,
  casesPollingTimer: null,

  refresh() {
    this.updateViewCounts();
    this.get('fetchCases').perform().then(() => {
      this.transitionToPreviousPageIfEmpty();
    }).catch(e => {
      if (!didCancel(e)) {
        throw e;
      }
    });
  },

  transitionToPreviousPageIfEmpty() {
    const cases = this.get('latestCases');
    if (cases.get('length')) {
      return;
    }

    const totalCases = cases.get('meta.total');
    if (!totalCases) {
      return;
    }

    const lastPageWithContent = Math.ceil(totalCases / CASE_PAGE_SIZE);
    this.get('router').transitionTo('session.agent.cases.index.view', [this.get('currentView.id')], { page: lastPageWithContent });
  },

  getViews() {
    const store = this.get('store');
    const views = this.get('views');
    const forceNextLoad = this.get('forceNextLoad');
    const limit = CASE_VIEW_LIMIT;
    const fields = 'resource_type,type,is_default,is_enabled,title,columns,order_by,order_by_column';
    const include = [];

    if (!forceNextLoad && views) {
      return views;
    }

    return store.query('view', { limit, fields, include }, { reload: true }).then(views => {
      this.set('views', views);
      this.set('forceNextLoad', false);
      return views;
    });
  },

  getCasesForView(view, params) {
    if (view !== this.get('currentCachedView')) {
      this.set('currentCachedView', null);
    }

    this.set('currentView', view);
    this.set('currentViewParms', params);

    Reflect.deleteProperty(params, 'view_id');
    const paramsAreEqual = _.isEqual(params, this.get('currentCachedParams'));

    if (view === this.get('currentCachedView') && paramsAreEqual) {
      this.get('fetchCases').perform();
      return resolve();
    } else {
      return this.get('fetchCases').perform();
    }
  },

  fetchCases: task(function * () {
    if (!Ember.testing) {
      this.initializeCasesPolling();
    }

    const view = this.get('currentView');
    const params = this.get('currentViewParms');
    const cases = yield this.get('refreshCases').perform(view, params);
    this.set('currentCachedView', view);
    this.set('currentCachedParams', params);
    this.set('latestCases', cases);
  }).restartable(),

  updateViewCounts(offset) {
    offset = offset || 0;
    const limit = 10;
    let options = {
      reload: true,
      fields: 'count,realtime_channel,view(is_default)',
      include: 'view',
      limit: limit,
      offset: offset || 0
    };
    const self = this;
    return this.get('store').query('view-count', options).then((data) => {
        if (offset + limit < data.meta.total) {
          self.updateViewCounts(offset + limit);
        } else {
          let viewSuspended = this.get('permissions').has('cases.view_suspended', this.get('session').get('user'));
          if (viewSuspended) {
              return this.get('store').query('mail', {is_suspended: true, offset: 0, limit: 0})
                  .then((mails) => {
                      this.setProperties({viewCounts: data, suspendedMailsCount: mails.meta.total});
                  });
          } else {
              this.setProperties({viewCounts: data, suspendedMailsCount: 0});
          }
        }
    });
  },

  isRefreshingCases: readOnly('refreshCases.isRunning'),

  refreshCases: task(function * (view, params) {
    if (!view) { return null; }

    const columnNames = ['conversation', ...view.get('columns').mapBy('name')];

    let { fields, includes } = mapToFieldsAndIncludes(columnNames);

    fields += ',created_at';

    const result = yield this.get('store').query('case', {
      limit: CASE_PAGE_SIZE,
      parent: view,
      offset: (parseInt(params.page, 10) - 1) * CASE_PAGE_SIZE,
      order_by: params.orderBy,
      fields,
      order_by_column: params.orderByColumn,
      include: includes
    });
    const store = this.get('store');
    const count = result.meta.total;
    const viewCount = yield view.get('viewCount');

    if (viewCount) {
      store.push({
        data: {
          id: viewCount.get('id'),
          type: 'view-count',
          attributes: { count }
        }
      });
    }

    return result;
  }).restartable(),

  pollView(views, params) {
    const view = views.findBy('id', params.view_id);

    return this.get('refreshCases').perform(view, params).then(cases => {
      if (view) {
        view.set('casesQuery', cases);
      }

      this.set('latestCases', cases);

      return view;
    });
  },

  initializeCasesPolling() {
    this.set('numberOfPollsSinceSomeoneAsked', 0);
    if (this.casesPollingTimer) {
      run.cancel(this.casesPollingTimer);
    }
    this.casesPollingTimer = run.later(this, this.pollCases, CASE_POLLING_TIME);
  },

  pollCases() {
    const view = this.get('currentCachedView');
    const params = this.get('currentCachedParams');
    this.incrementProperty('numberOfPollsSinceSomeoneAsked');

    this.get('refreshCases').perform(view, params).then(cases => this.set('latestCases', cases));

    let pollingDelayFactor = Math.ceil(this.get('numberOfPollsSinceSomeoneAsked') / 10);
    if (this.casesPollingTimer) {
      run.cancel(this.casesPollingTimer);
    }
    this.casesPollingTimer = run.later(this, this.pollCases, CASE_POLLING_TIME * pollingDelayFactor);
  },

  cancelCasePolling() {
    if (this.casesPollingTimer) {
      run.cancel(this.casesPollingTimer);
    }
  },

  inboxCount: computed('viewCounts.@each.view', function() {
    let viewCounts = this.get('viewCounts');

    return viewCounts && viewCounts.findBy('view.isDefault');
  }),

  inboxView: computed('views', function() {
    let views = this.get('views');
    return views && views.findBy('isDefault');
  }),

  enabledViewsWithoutInbox: computed('views', 'inboxView', function() {
    return this.get('views').filter(v => v.id !== this.get('inboxView').id && v.get('isEnabled'));
  })
});
