import QUnit, { test } from 'qunit';
import { createModule as createQUnitModule } from 'ember-qunit/qunit-module';
import {
  TestModule,
  TestModuleForComponent,
  TestModuleForModel
} from 'ember-test-helpers';
import { setResolver } from 'ember-test-helpers';
import moduleForAcceptance from 'frontend-cp/tests/helpers/module-for-acceptance';

import { andHelper } from 'ember-truth-helpers/helpers/and';
import { equalHelper } from 'ember-truth-helpers/helpers/equal';
import { notHelper } from 'ember-truth-helpers/helpers/not';
import { orHelper } from 'ember-truth-helpers/helpers/or';
import {
  registerHelper as registerTruthHelper
} from 'ember-truth-helpers/utils/register-helper';

import propertiesEqualAssertion from '../assertions/properties-equal';

QUnit.assert.propertiesEqual = propertiesEqualAssertion;

export function createModule(Constructor, name, description, callbacks) {
  let actualCallbacks = callbacks || (typeof description === 'object' ? description : {});
  let beforeCallback = actualCallbacks.setup || actualCallbacks.beforeEach;
  actualCallbacks['beforeEach' in actualCallbacks ? 'beforeEach' : 'setup'] = function () {
    registerTruthHelper('and', andHelper);
    registerTruthHelper('eq', equalHelper);
    registerTruthHelper('not', notHelper);
    registerTruthHelper('or', orHelper);

    if (beforeCallback) {
      Reflect.apply(beforeCallback, this, arguments);
    }
  };

  if (typeof description !== 'object' && !description) {
    return createQUnitModule(Constructor, name, description, actualCallbacks);
  }

  return createQUnitModule(Constructor, name, actualCallbacks);
}

export function moduleForComponent(name, description, callbacks) {
  createModule(TestModuleForComponent, name, description, callbacks);
}

export function moduleForModel(name, description, callbacks) {
  createModule(TestModuleForModel, name, description, callbacks);
}

export function moduleFor(name, description, callbacks) {
  createModule(TestModule, name, description, callbacks);
}

export { test, setResolver, moduleForAcceptance as app };
