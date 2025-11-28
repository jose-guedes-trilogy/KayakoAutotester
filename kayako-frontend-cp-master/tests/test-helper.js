import resolver from './helpers/resolver';
import {
  setResolver
} from 'ember-qunit';
import { start } from 'ember-cli-qunit';
import loadEmberExam from 'ember-exam/test-support/load';

import 'ember-launch-darkly/test-support/helpers/with-variation';


// version of deepEqual which stringifies values so they work with Testem
import QUnit from 'qunit';
QUnit.config.testTimeout = 30000; // 30 sec
QUnit.assert.deepEqual = function(actual, expected, message) {
  let equiv = QUnit.equiv(actual, expected);
  this.push(equiv, JSON.stringify(actual), JSON.stringify(expected), message);
};


loadEmberExam();
setResolver(resolver);
start();
