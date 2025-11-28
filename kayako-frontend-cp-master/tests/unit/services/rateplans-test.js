import { A } from '@ember/array';
import EmberObject from '@ember/object';
import { moduleFor, test } from 'ember-qunit';

moduleFor('service:rateplans', 'Unit | Service | rateplans', {
  integration: true
});

test('should return the primary rateplan when a single rateplan is given', function(assert) {
  let service = this.subject();
  const productRateplan = EmberObject.create({
    productRateplanType: 'PRIMARY',
    name: 'Enterpise Monthly'
  });
  const rateplan = EmberObject.create({
    id: 1,
    productRateplan: productRateplan,
    charges: [{}]
  });
  const ratePlans = A([rateplan]);
  const subscriptonRatePlan = service.getSubscriptionRatePlan(ratePlans);
  assert.equal(subscriptonRatePlan.get('id'), 1);
});

test('should return the primary rateplan when a multiple single rateplans are given', function(assert) {
  let service = this.subject();

  const productRateplanDiscount = EmberObject.create({
    productRateplanType: 'DISCOUNT',
    name: 'Discount Monthly'
  });

  const productRateplanGrowth = EmberObject.create({
    productRateplanType: 'PRIMARY',
    name: 'Growth Monthly'
  });

  const discount = EmberObject.create({
    id: 1,
    productRateplan: productRateplanDiscount,
    charges: [{}]
  });

  const growth = EmberObject.create({
    id: 18,
    productRateplan: productRateplanGrowth,
    charges: [{}]
  });

  const ratePlans = A([discount, growth]);
  const subscriptonRatePlan = service.getSubscriptionRatePlan(ratePlans);
  assert.equal(subscriptonRatePlan.get('id'), 18);
});

test('should null when nothing is found', function(assert) {
  let service = this.subject();
  const productRateplan = EmberObject.create({
    productRateplanType: 'DISCOUNT',
    name: 'Enterpise Monthly'
  });
  const rateplan = EmberObject.create({
    id: 1,
    productRateplan: productRateplan,
    charges: [{}]
  });
  const ratePlans = A([rateplan]);
  const subscriptonRatePlan = service.getSubscriptionRatePlan(ratePlans);
  assert.equal(subscriptonRatePlan, null);
});

test('should return true for fixed discount when model is DISCOUNTFIXEDAMOUNT', function(assert) {
  let service = this.subject();
  const charge = EmberObject.create({
    id: 1,
    model: 'DISCOUNTFIXEDAMOUNT'
  });
  const isFixedDiscount = service.isFixedDiscount(charge);
  assert.equal(isFixedDiscount, true);
});

test('should return true for percentage discount when model is DISCOUNTPERCENTAGE', function(assert) {
  let service = this.subject();
  const charge = EmberObject.create({
    id: 1,
    model: 'DISCOUNTPERCENTAGE'
  });
  const isPercentageDiscount = service.isPercentageDiscount(charge);
  assert.equal(isPercentageDiscount, true);
});

test('should return true for isDiscount when model is of valid discount type', function(assert) {
  let service = this.subject();
  const charge = EmberObject.create({
    id: 1,
    model: 'DISCOUNTPERCENTAGE'
  });
  const isDiscount = service.isDiscount(charge);
  assert.equal(isDiscount, true);
});

test('should return false for isDiscount when model is not of valid discount type', function(assert) {
  let service = this.subject();
  const charge = EmberObject.create({
    id: 1,
    model: 'AGENTS'
  });
  const isDiscount = service.isDiscount(charge);
  assert.equal(isDiscount, false);
});

test('should apply flat discount when defined', function(assert) {
  let service = this.subject();
  const total = 1000;
  const flatDiscount = 100;
  const percentageDiscount = 0;
  const discount = service.getDiscount(total, flatDiscount, percentageDiscount);
  assert.equal(discount, 100);
});

test('should apply percentage discount when defined', function(assert) {
  let service = this.subject();
  const total = 1000;
  const flatDiscount = 0;
  const percentageDiscount = 15;
  const discount = service.getDiscount(total, flatDiscount, percentageDiscount);
  assert.equal(discount, 150);
});

test('should apply both discounts when defined | first fixed discount', function(assert) {
  let service = this.subject();
  const total = 1000;
  const flatDiscount = 100;
  const percentageDiscount = 15;
  const discount = service.getDiscount(total, flatDiscount, percentageDiscount);
  assert.equal(discount, 235);
});

test('should return 0 when discount is not available', function(assert) {
  let service = this.subject();
  const total = 1000;
  const flatDiscount = 0;
  const percentageDiscount = 0;
  const discount = service.getDiscount(total, flatDiscount, percentageDiscount);
  assert.equal(discount, 0);
});

test('should return 0 for discounts when current term does not have discount', function(assert) {
  let service = this.subject();
  const productRateplan = EmberObject.create({
    name: 'Discount Annually'
  });

  const charge = EmberObject.create({
    id: 2,
    model: 'DISCOUNTFIXEDAMOUNT',
    defaultQuantity: 20,
    billingPeriod: 'ANNUAL'
  });

  const rateplan = EmberObject.create({
    id: 1,
    productRateplan: productRateplan,
    charges: A([charge])
  });

  const ratePlans = A([rateplan]);
  const discounts = service.getTermDiscount(ratePlans, 'MONTH');
  assert.deepEqual(discounts, {fixed: 0, percentage: 0});
});

test('should return 0 for discounts when unable to find charges for valid discount types', function(assert) {
  let service = this.subject();
  const productRateplan = EmberObject.create({
    name: 'Primary Annually'
  });

  const charge = EmberObject.create({
    id: 2,
    model: 'PRIMARY',
    defaultQuantity: 20,
    billingPeriod: 'MONTH'
  });

  const rateplan = EmberObject.create({
    id: 1,
    productRateplan: productRateplan,
    charges: A([charge])
  });

  const ratePlans = A([rateplan]);
  const discounts = service.getTermDiscount(ratePlans, 'MONTH');
  assert.deepEqual(discounts, {fixed: 0, percentage: 0});
});

test('should set fixed discount amount when fixed discount is available', function(assert) {
  let service = this.subject();
  const productRateplan = EmberObject.create({
    name: 'Primary Annually'
  });

  const charge = EmberObject.create({
    id: 2,
    model: 'DISCOUNTFIXEDAMOUNT',
    defaultQuantity: 20,
    billingPeriod: 'MONTH'
  });

  const rateplan = EmberObject.create({
    id: 1,
    productRateplan: productRateplan,
    charges: A([charge])
  });

  const ratePlans = A([rateplan]);
  const discounts = service.getTermDiscount(ratePlans, 'MONTH');
  assert.deepEqual(discounts, {fixed: 20, percentage: 0});
});

test('should set percentage discount when percentage discount is available', function(assert) {
  let service = this.subject();
  const productRateplan = EmberObject.create({
    name: 'Primary Annually'
  });

  const charge = EmberObject.create({
    id: 2,
    model: 'DISCOUNTPERCENTAGE',
    defaultQuantity: 20,
    billingPeriod: 'MONTH'
  });

  const rateplan = EmberObject.create({
    id: 1,
    productRateplan: productRateplan,
    charges: A([charge])
  });

  const ratePlans = A([rateplan]);
  const discounts = service.getTermDiscount(ratePlans, 'MONTH');
  assert.deepEqual(discounts, {fixed: 0, percentage: 20});
});

test('should set both discounts when they are available on a single a rateplan', function(assert) {
  let service = this.subject();
  const productRateplan = EmberObject.create({
    name: 'Primary Annually'
  });

  const charge = EmberObject.create({
    id: 2,
    model: 'DISCOUNTPERCENTAGE',
    defaultQuantity: 20,
    billingPeriod: 'MONTH'
  });

  const anotherCharge = EmberObject.create({
    id: 2,
    model: 'DISCOUNTFIXEDAMOUNT',
    defaultQuantity: 10,
    billingPeriod: 'MONTH'
  });

  const rateplan = EmberObject.create({
    id: 1,
    productRateplan: productRateplan,
    charges: A([charge, anotherCharge])
  });

  const ratePlans = A([rateplan]);
  const discounts = service.getTermDiscount(ratePlans, 'MONTH');
  assert.deepEqual(discounts, {fixed: 10, percentage: 20});
});

test('should set both discounts when they are available on a different rateplans', function(assert) {
  let service = this.subject();
  const productRateplan = EmberObject.create({
    name: 'Discount Monthly Percentage'
  });

  const charge = EmberObject.create({
    id: 2,
    model: 'DISCOUNTPERCENTAGE',
    defaultQuantity: 8,
    billingPeriod: 'MONTH'
  });

  const anotherProductRateplan = EmberObject.create({
    name: 'Discount Monthly Fixed'
  });

  const anotherCharge = EmberObject.create({
    id: 2,
    model: 'DISCOUNTFIXEDAMOUNT',
    defaultQuantity: 4,
    billingPeriod: 'MONTH'
  });

  const rateplan = EmberObject.create({
    id: 1,
    productRateplan: productRateplan,
    charges: A([charge])
  });

  const anotherRateplan = EmberObject.create({
    id: 1,
    productRateplan: anotherProductRateplan,
    charges: A([anotherCharge])
  });

  const ratePlans = A([rateplan, anotherRateplan]);
  const discounts = service.getTermDiscount(ratePlans, 'MONTH');
  assert.deepEqual(discounts, {fixed: 4, percentage: 8});
});

test('should return a unique list of terms', function(assert) {
  let service = this.subject();
  const productRateplan = EmberObject.create({
    name: 'Standard'
  });

  const charge = EmberObject.create({
    id: 2,
    defaultQuantity: 8,
    billingPeriod: 'MONTH'
  });

  const charge2 = EmberObject.create({
    id: 2,
    defaultQuantity: 8,
    billingPeriod: 'ANNUAL'
  });

  const anotherProductRateplan = EmberObject.create({
    name: 'Standard'
  });

  const anotherCharge = EmberObject.create({
    id: 2,
    defaultQuantity: 4,
    billingPeriod: 'ANNUAL'
  });

  const rateplan = EmberObject.create({
    id: 1,
    productRateplan: productRateplan,
    charges: A([charge, charge2])
  });

  const anotherRateplan = EmberObject.create({
    id: 1,
    productRateplan: anotherProductRateplan,
    charges: A([anotherCharge])
  });

  const ratePlans = A([rateplan, anotherRateplan]);
  const terms = service.getTerms(ratePlans);
  assert.deepEqual(terms, ['MONTH', 'ANNUAL']);
});
