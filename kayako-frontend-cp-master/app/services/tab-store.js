import Service from '@ember/service';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { debounce } from '@ember/runloop';
import { get, getProperties } from '@ember/object';
import { set, setProperties } from '@ember/object';
import { getOwner } from '@ember/application';
import { getMetaData } from 'frontend-cp/utils/bugsnag';

import ENV from 'frontend-cp/config/environment';

export default Service.extend({
  routing: service('-routing'),
  localStore: service('localStore'),
  confirmation: service(),
  processManager: service(),

  casesViewId: null,
  caseState: null,
  insertTabAtIndex: null,
  activeTab: null,

  //CPs
  tabs: computed(function() {
    let tabs = this.get('localStore').getItem(ENV.localStore.defaultNamespace, 'tabs') || [];
    return tabs.map(tab => this.deserializeTab(tab)).compact();
  }),

  //Public API
  setCasesViewId(viewId) {
    this.set('casesViewId', viewId);
  },

  transitionAndInsertTabNextToActiveTab() {
    const router = this.get('routing');

    this.set('insertTabAtIndex', this.get('tabs').indexOf(this.get('activeTab')) + 1);
    router.transitionTo(...arguments)
      .finally(() => this.set('insertTabAtIndex', null));
  },

  selectPreviousTab() {
    const previousTab = this.previousTab();
    if (previousTab) {
      this.selectTab(previousTab);
    }
  },

  selectNextTab() {
    const nextTab = this.nextTab();
    if (nextTab) {
      this.selectTab(nextTab);
    }
  },

  open(transition) {
    const { basePath, routeName, dynamicSegments, queryParams } = this.decomposeTransition(transition);
    const tabs = this.get('tabs');

    for (let tab of tabs) {
      if (this._compareTabAndTargetTabBasePath(tab.basePath, basePath)) {
        this.set('activeTab', tab);
        return tab;
      }
    }

    const tab = this._buildTab({ basePath, routeName, dynamicSegments, queryParams});

    tab.linkParams = [routeName, ...dynamicSegments];
    if (queryParams) {
      tab.linkParams.push(this._buildQueryParams(queryParams));
    }
    if (this.get('insertTabAtIndex') !== null) {
      this.get('tabs').insertAt(this.get('insertTabAtIndex'), tab);
    } else {
      this.get('tabs').addObject(tab);
    }

    this.set('activeTab', tab);
    this.schedulePersistTabs();
    return tab;
  },

  createTab(routeName, model, queryParams) {
    if (model.get('_isFullyLoaded') === false) {
      model.reload();
    }
    const processManager = this.get('processManager');
    const process = processManager.getOrCreateProcess(model, model.constructor.modelName);

    const dynamicSegments = [get(model, 'id')];
    const basePath = this.get('routing').generateURL(routeName, dynamicSegments);
    const tabs = this.get('tabs');

    for (let tab of tabs) {
      if (this._compareTabAndTargetTabBasePath(tab.basePath, basePath)) {
        return tab;
      }
    }

    const tab = this._buildTab({
      process,
      basePath,
      routeName,
      dynamicSegments,
      queryParams,
      linkParams: [routeName, ...dynamicSegments]
    });
    if (queryParams) {
      tab.linkParams.push(this._buildQueryParams(queryParams));
    }

    this.get('tabs').addObject(tab);
    this.schedulePersistTabs();
    return tab;
  },

  createTabNextToActiveTab() {
    this.set('insertTabAtIndex', this.get('tabs').indexOf(this.get('activeTab')) + 1);
    this.createTab(...arguments);
    this.set('insertTabAtIndex', null);
  },

  getTab(basePath) {
    return this.get('tabs').findBy('basePath', basePath);
  },

  close(tab, discardChanges = false) {
    const isEdited = get(tab, 'state.case._isEdited') ||
      get(tab, 'state.user._isEdited') ||
      get(tab, 'state.organization._isEdited');

    if (isEdited && !discardChanges) {
      this.get('confirmation').confirm({
        intlConfirmationBody: 'generic.unsaved_tab_changes',
        intlConfirmLabel: 'generic.continue_button'
      }).then(() => {
        this._closeTab(tab);
      });
    } else {
      this._closeTab(tab);
    }
  },

  closeActiveTab(discardChanges = false) {
    const active = this.get('activeTab');
    if (!active) {
      return null;
    }
    return this.close(active, discardChanges);
  },

  leave(tab) {
    if (this.get('activeTab') === tab) {
      this.set('activeTab', null);
    }
  },

  update(tab, changes) {
    setProperties(tab, changes);
    const { routeName, dynamicSegments } = getProperties(tab, 'routeName', 'dynamicSegments');
    set(tab, 'linkParams', [routeName, ...dynamicSegments]);

    this.schedulePersistTabs();
  },

  updateState(tab, newState) {
    tab.state = Object.assign(tab.state || {}, newState);
    this.schedulePersistTabs();
  },

  clearAll() {
    this.get('tabs').clear();
    this.persistTabs();
  },

  //Private API

  previousTab(tab, wrap = true) {
    const tabs = this.get('tabs');
    if (tabs.length <= 1) {
      return null;
    }

    const activeTab = tab || this.get('activeTab');
    const activeIndex = tabs.indexOf(activeTab);

    let prevIndex = activeIndex - 1;
    if (prevIndex < 0) {
      if (!wrap) {
        return null;
      }
      prevIndex = tabs.length - 1;
    }

    return tabs[prevIndex];
  },

  nextTab(tab, wrap = true) {
    const tabs = this.get('tabs');
    if (tabs.length <= 1) {
      return null;
    }

    const activeTab = tab || this.get('activeTab');
    const activeIndex = tabs.indexOf(activeTab);

    let nextIndex = activeIndex + 1;
    if (nextIndex >= tabs.length) {
      if (!wrap) {
        return null;
      }
      nextIndex = 0;
    }

    return tabs[nextIndex];
  },

  selectTab(tab) {
    const routing = this.get('routing');
    routing.transitionTo(tab.routeName, tab.dynamicSegments, tab.queryParams || {});
  },

  _closeTab(tab) {
    this._destroyProcess(tab);

    const routing = this.get('routing');
    const tabs = this.get('tabs');
    if (this.get('activeTab') !== tab) {
      tab.onClose();
      tabs.removeObject(tab);
    } else {
      const nextTab = this.nextTab(tab, false) || this.previousTab(tab, false);

      tab.onClose();
      tabs.removeObject(tab);

      if (tab.queryParams && tab.queryParams.returnTo) {
        routing.transitionTo(tab.queryParams.returnTo);
      } else if (nextTab) {
        this.selectTab(nextTab);
      } else {
        if (this.get('casesViewId')) {
          routing.transitionTo('session.agent.cases.index.view', [this.get('casesViewId')], {});
        } else {
          routing.transitionTo('session.agent.cases.index');
        }
      }
    }
    this.schedulePersistTabs();
  },

  schedulePersistTabs() {
    debounce(this, 'persistTabs', 100);
  },

  persistTabs() {
    let tabs = this.get('tabs') || [];

    if (this.isDestroying || this.isDestroyed) {
      return;
    }

    this.get('localStore')
      .setItem(ENV.localStore.defaultNamespace, 'tabs', tabs.map(this.serializeTab).compact());
  },

  decomposeTransition(transition) {
    const routeName = transition.handlerInfos[transition.resolveIndex].name;
    const queryParams = Object.keys(transition.queryParams).length > 0 ? transition.queryParams : null;
    // The dynamic segments are wrong. It should include all the dynamic segments
    // of all parent routes, not only the ones of this one.
    let dynamicSegments = transition.intent.contexts;
    if (!dynamicSegments || !dynamicSegments.length) {
      dynamicSegments = Object.keys(transition.params).reduce((ary, k) => {
        let params = transition.params[k];
        if (Object.keys(params).length > 0) {
          return ary.concat(Object.keys(params).map(k => params[k]));
        } else {
          return ary;
        }
      }, []).compact();
    }
    const url = this.get('routing').generateURL(routeName, dynamicSegments, queryParams || {});
    const [basePath] = url.split('?');
    return { basePath, routeName, dynamicSegments, queryParams };
  },

  serializeTab(tab) {
    if (!tab.process) {
      // tabs are often constructed in two phases, the tab opened & the process set later
      // don't store if we're half-way through, we'll get called again in a moment…
      return null;
    }

    let json = {
      basePath: tab.basePath,
      routeName: tab.routeName,
      dynamicSegments: tab.dynamicSegments.map(ds => ds && typeof ds === 'object' ? ds.id : ds),
      queryParams: tab.queryParams,
      state: tab.state,
      processId: get(tab.process, 'pid')
    };

    return json;
  },

  deserializeTab(tab) {
    tab.basePath = tab.basePath.replace(/case/g, 'conversation');

    tab.linkParams = [tab.routeName, ...tab.dynamicSegments];
    if (tab.queryParams) {
      tab.linkParams.push(this._buildQueryParams(tab.queryParams));
    }

    if (tab.processId) {
      let processManager = this.get('processManager');
      tab.process = processManager.getProcessByPid(tab.processId);
    }

    if (!tab.process) {
      if (!Ember.testing && window.Bugsnag) {
        let context = getMetaData(null, getOwner(this));
        context.tab = {
          processId: tab.processId,
          basePath: tab.basePath,
          routeName: tab.routeName
        };
        window.Bugsnag.notify('DeserializeTabError', 'No process found when deserializing tab', context, 'info');
      }
      return null;
    }

    return this._buildTab(tab);
  },

  _buildTab(attrs = {}) {
    return Object.assign({
      process: null,
      basePath: null,
      routeName: null,
      dynamicSegments: [],
      queryParams: [],
      state: {},
      onClose: () => {}
    }, attrs);
  },

  // This is pretty private API. I been told that it's unlikely to change, but still, caution.
  _buildQueryParams(hash) {
    return {
      isQueryParams: true,
      values: hash
    };
  },

  _destroyProcess(tab) {
    let processManager = this.get('processManager');

    let process = tab.process;

    if (process) {
      processManager.destroyProcess(process);
    }
  },

  _compareTabAndTargetTabBasePath(tabBasePath, targetBasePath) {
    [tabBasePath] = tabBasePath.split('?');
    [targetBasePath] = targetBasePath.split('?');
    return tabBasePath === targetBasePath;
  }
});
