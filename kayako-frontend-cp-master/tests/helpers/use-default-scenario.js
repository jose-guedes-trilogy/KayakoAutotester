import { registerAsyncHelper } from '@ember/test';
import defaultScenario from 'frontend-cp/mirage/scenarios/default';

export default registerAsyncHelper('useDefaultScenario', function() {
  defaultScenario(server); //eslint-disable-line no-undef
});
