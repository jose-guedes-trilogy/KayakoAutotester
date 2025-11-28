import Application from '../../app';
import config from '../../config/environment';
import { assign } from '@ember/polyfills';
import { run } from '@ember/runloop';

import './login';
import './fill-in-rich-text-editor';
import './use-default-scenario';

import 'ember-sortable/helpers/reorder';
// import 'ember-sortable/helpers/drag';
import './drag';
import './reorder-inputs';
import './reorder-list-items';

import './scroll-to-bottom-of-page';
import './input-array-to-input-val-array';
import './text-nodes-to-array';
import './logout';

import registerPowerSelectHelpers from './ember-power-select';
registerPowerSelectHelpers();

export default function startApp(attrs) {
  let attributes = assign({}, config.APP);
  attributes = assign(attributes, attrs); // use defaults, but you can override;

  return run(() => {
    let application = Application.create(attributes);
    application.setupForTesting();
    application.injectTestHelpers();
    application.__container__.lookup('service:local-store').clearAll();
    return application;
  });
}
