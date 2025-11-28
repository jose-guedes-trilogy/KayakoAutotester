import Controller from '@ember/controller';
import InsightsControlActions from 'frontend-cp/mixins/insights-control-actions';

export default Controller.extend(InsightsControlActions, {
  metricsQueryParams: null
});
