import Service, { inject as service } from '@ember/service';
import config from 'frontend-cp/config/environment';
import moment from 'moment';
import { getOwner } from '@ember/application';
import { getChartPointInterval } from 'frontend-cp/lib/chart-point-intervals';

export default Service.extend({
  notification: service(),
  localstore: service('local-store'),
  plan: service(),
  i18n: service(),
  store: service(),

  restoreTrialNotification() {
    this.get('localstore').removeItem(config.localStore.defaultNamespace, 'trial.insights', { persist: true });
  },

  isTrialDataEnabled() {
    const trialMarker = this.get('localstore').getItem(config.localStore.defaultNamespace, 'trial.insights', { persist: true });
    return trialMarker !== false;
  },

  isTrialMode() {
    return this.get('plan.isTrial') && this.isTrialDataEnabled();
  },

  metricsEndpoint() {
    const adapter = getOwner(this).lookup('adapter:application');

    let endpoint = `${adapter.namespace}/insights/cases/metrics`;

    if (this.isTrialMode()) {
      endpoint = 'assets/trial/insights/cases/metrics.json';
    }

    return endpoint;
  },

  caseResolutionEndpoint() {
    const adapter = getOwner(this).lookup('adapter:application');

    let endpoint = `${adapter.namespace}/insights/cases/resolution`;

    if (this.isTrialMode()) {
      endpoint = 'assets/trial/insights/cases/resolution.json';
    }

    return endpoint;
  },

  csatEndpoint() {
    const adapter = getOwner(this).lookup('adapter:application');

    let endpoint = `${adapter.namespace}/insights/cases/csat`;

    if (this.isTrialMode()) {
      endpoint = 'assets/trial/insights/cases/csat.json';
    }

    return endpoint;
  },

  casesCompletedEndpoint() {
    const adapter = getOwner(this).lookup('adapter:application');

    let endpoint = `${adapter.namespace}/insights/cases/completed`;

    if (this.isTrialMode()) {
      endpoint = 'assets/trial/insights/cases/completed.json';
    }

    return endpoint;
  },

  caseResponseEndpoint() {
    const adapter = getOwner(this).lookup('adapter:application');

    let endpoint = `${adapter.namespace}/insights/cases/response`;

    if (this.isTrialMode()) {
      endpoint = 'assets/trial/insights/cases/response.json';
    }

    return endpoint;
  },

  channelEndpoint() {
    const adapter = getOwner(this).lookup('adapter:application');

    let endpoint = `${adapter.namespace}/insights/cases/channel`;

    if (this.isTrialMode()) {
      endpoint = 'assets/trial/insights/cases/channel.json';
    }

    return endpoint;
  },

  articlesEndpoint() {
    const adapter = getOwner(this).lookup('adapter:application');

    let endpoint = `${adapter.namespace}/insights/helpcenter/articles`;

    if (this.isTrialMode()) {
      endpoint = 'assets/trial/insights/helpcenter/articles.json';
    }

    return endpoint;
  },

  searchEndpoint() {
    const adapter = getOwner(this).lookup('adapter:application');

    let endpoint = `${adapter.namespace}/insights/helpcenter/search`;

    if (this.isTrialMode()) {
      endpoint = 'assets/trial/insights/helpcenter/search.json';
    }

    return endpoint;
  },

  slaTargetEndpoint() {
    const adapter = getOwner(this).lookup('adapter:application');

    let endpoint = `${adapter.namespace}/insights/sla/target`;

    if (this.isTrialMode()) {
      endpoint = 'assets/trial/insights/sla/target.json';
    }

    return endpoint;
  },

  slaPerformanceEndpoint() {
    const adapter = getOwner(this).lookup('adapter:application');

    let endpoint = `${adapter.namespace}/insights/sla/performance`;

    if (this.isTrialMode()) {
      endpoint = 'assets/trial/insights/sla/performance.json';
    }

    return endpoint;
  },

  pushTrialNotification(callback) {
    const notifications = this.get('notification');
    const localstore = this.get('localstore');
    const i18n = this.get('i18n');

    notifications.add({
      unique: true,
      type: 'info',
      title: i18n.t('insights.trial.notification.title'),
      autodismiss: false,
      dismissable: false,
      href: '#',
      hrefTarget: '_self',
      hrefText: i18n.t('insights.trial.notification.link'),
      onClose: () => {
        localstore.setItem(
          config.localStore.defaultNamespace,
          'trial.insights',
          false,
          { persist: true }
        );

        callback();
      }
    });
  },

  skewDate(date, days) {
    let skewStart = new Date(date);
    skewStart.setDate(skewStart.getDate() + days);

    return moment(skewStart).format('YYYY-MM-DD');
  },

  _getDayOfWeek: function(date) {
    return new Date(date + 'T00:00:00.000Z').getDay();
  },

  getPreviousDates(startAt, endAt) {
    let currentPeriodDays = Math.floor((new Date(endAt + 'T23:59:59.999Z') - new Date(startAt + 'T00:00:00.000Z')) / 86400000);
    let currentStartDay = this._getDayOfWeek(startAt);
    let currentEndDay = this._getDayOfWeek(endAt);

    // calculate amount of days to subtract to have correct previous period mapped by day to day
    let diff = currentEndDay - currentStartDay ? -7 + (currentEndDay - currentStartDay) : -1;
    let previousEnd = this.skewDate(new Date(startAt + 'T00:00:00.000Z'), diff);
    let previousStart = this.skewDate(new Date(previousEnd + 'T00:00:00.000Z'), -1 * currentPeriodDays);

    return {
      previousStart,
      previousEnd
    };
  },

  prepareSeriesData(data, previous, startDate, endDate, previousStartDate, interval) {
    const startAt = new Date(startDate);
    const endAt = new Date(endDate);
    const point = Date.UTC(startAt.getFullYear(), startAt.getMonth(), startAt.getDate());
    const pointInterval = getChartPointInterval(interval);

    let currentData, previousData;

    let todayDate = new Date();
    let todayPoint = Date.UTC(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() + 1);

    let zones = [];
    if (endAt > todayDate) {
      zones = [{
        value: todayPoint,
        dashStyle: 'Solid'
      }, {
        dashStyle: 'Dot'
      }];
    }

    if (data) {
      let startTime = startAt.getTime();
      currentData = data.map(record => {
        let data = {
          y: record,
          date: startTime
        };
        startTime += pointInterval;
        return data;
      });
    }

    if (previous) {
      let previousStartTime = new Date(previousStartDate).getTime();
      previousData = previous.map(record => {
        let data = {
          y: record,
          date: previousStartTime
        };
        previousStartTime += pointInterval;
        return data;
      });
    }

    return {
      current: currentData,
      previous: previousData,
      point,
      zones,
      pointInterval
    };
  },

  requestSLAs() {
    const adapter = getOwner(this).lookup('adapter:application');

    return this.get('store').findAll('sla').then(data => {
      if (!data.get('length') && this.isTrialMode()) {
        return adapter.ajax('/assets/trial/insights/slas.json', 'GET').then(slas => slas.data);
      }
      return data;
    });
  },

  restructureSlaPerformanceSeries(data, resources, slas, currentSla) {
    let performanceSeries = data.performance_series.map((performance) => {
      return {
        series: performance.series,
        sla: resources.sla[performance.sla.id]
      };
    });
    let slaItem;

    if (this.isTrialMode()) {
      /**
       * In trial mode, we can't match returned SLA from server with current SLA
       * because ID of mocked data won't match with current ID in a system.
       * So we just return first object from performance_series.
       */
      performanceSeries = [performanceSeries.get('firstObject')];
      slaItem = slas.get('firstObject');
    } else {
      performanceSeries = performanceSeries.filter(series => parseInt(series.sla.id) === parseInt(currentSla));
      slaItem = slas.find(sla => sla.get('id') === currentSla);
    }

    data.performance_series = performanceSeries;

    return {
      data,
      slaItem
    };
  }
});
