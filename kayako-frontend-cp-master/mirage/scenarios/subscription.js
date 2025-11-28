/**
 * This scenario creates the following key resources (and their
 * less-interesting sub-resources) and wires them all together:
 *
 * - A generic Product
 * - The following ProductRateplans for that product:
 *   - Standard - Monthly
 *   - Standard - Annually
 *   - Growth - Monthly
 *   - Growth - Annually
 *   - Enterprise - Monthly
 *   - Enterprise - Annually
 * - An Account
 * - A Subscription for the "Standard - Monthly" rateplan
 * - A Plan
 *
 * It’s actually a little bit of a kludge to have an entry in the db for Plan
 * because in reality it’s a composite of a bunch of other resources and bits
 * of config. There’s the risk that it could get out of sync with the things it
 * composes.
 *
 * However, for now it’ll do.
 *
 * @function subscriptionScenario
 * @param {Mirage.Server} server
 * @returns {null}
 */
export default function subscriptionScenario(server) {
  let product = createProduct(server);
  let account = createAccount(server);
  let productRateplans = createProductRateplans(server, product);
  let subscription = createSubscription(server, account, productRateplans[0]);

  createPlan(server, subscription);
}

const RATEPLAN_SPECS = [{
  label: 'Standard',
  period: 'Month',
  price: 24
}, {
  label: 'Standard',
  period: 'Annual',
  price: 240
}, {
  label: 'Growth',
  period: 'Month',
  price: 49
}, {
  label: 'Growth',
  period: 'Annual',
  price: 480
}, {
  label: 'Enterprise',
  period: 'Month',
  price: 109
}, {
  label: 'Enterprise',
  period: 'Annual',
  price: 1080
}];

function createProduct(server) {
  return server.create('product');
}

function createAccount(server) {
  let contact = server.create('contact');

  return server.create('account', {
    sold_to: {
      resource_type: 'contact',
      id: contact.id
    },
    bill_to: {
      resource_type: 'contact',
      id: contact.id
    }
  });
}

function createProductRateplans(server, product) {
  return RATEPLAN_SPECS.map(({ label, period, price }) => {
    let name = `${label} - ${period}ly`;
    let key = label.toLowerCase();

    return server.create('product-rateplan', {
      name,
      key,
      label,
      product: {
        resource_type: 'product',
        id: product.id
      },
      charges: [{
        resource_type: 'product_rateplan_charge',
        id: createAgentProductCharge(server, name, period, price).id
      }, {
        resource_type: 'product_rateplan_charge',
        id: createCollaboratorProductCharge(server, period).id
      }]
    });
  });
}

function createSubscription(server, account, productRateplan) {
  return server.create('subscription', {
    account: {
      resource_type: 'account',
      id: account.id
    },
    invoice_owner: {
      resource_type: 'account',
      id: account.id
    },
    rateplans: [{
      resource_type: 'rateplan',
      id: createRateplan(server, productRateplan).id
    }]
  });
}

function createPlan(server, subscription) {
  let { db } = server;
  let rateplan = db.rateplans.find(subscription.rateplans[0].id);
  let productRateplan = db.productRateplans.find(rateplan.product_rateplan.id);
  let product = db.products.find(productRateplan.product.id);

  return server.create('plan', {
    name: productRateplan.label,
    subscription_id: subscription.id,
    rateplan_id: rateplan.id,
    product: {
      resource_type: 'product',
      id: product.id
    }
  });
}

function createAgentProductCharge(server, name, period, price) {
  return server.create('product-rateplan-charge', {
    name,
    billing_period: period.toUpperCase(),
    unit_of_measure: 'AGENTS',
    default_quantity: 10,
    tiers: [{
      resource_type: 'product_rateplan_charge_tier',
      id: paidProductTier(server, price).id
    }]
  });
}

function createCollaboratorProductCharge(name, period) {
  return server.create('product-rateplan-charge', {
    name: 'Collaborators',
    billing_period: period.toUpperCase(),
    unit_of_measure: 'COLLABORATORS',
    default_quantity: 25,
    tiers: [{
      resource_type: 'product_rateplan_charge_tier',
      id: freeProductTier(server).id
    }]
  });
}

function createRateplan(server, productRateplan) {
  let { productRateplanCharges } = server.db;
  let agentProductCharge = productRateplanCharges.find(productRateplan.charges[0].id);
  let collaboratorProductCharge = productRateplanCharges.find(productRateplan.charges[1].id);

  return server.create('rateplan', {
    name: productRateplan.name,
    product_rateplan: {
      resource_type: 'product_rateplan',
      id: productRateplan.id
    },
    charges: [{
      resource_type: 'charge',
      id: createAgentCharge(server, agentProductCharge).id,
    }, {
      resource_type: 'charge',
      id: createCollaboratorCharge(server, collaboratorProductCharge).id
    }]
  });
}

function createAgentCharge(server, productRateplanCharge) {
  return server.create('charge', {
    name: productRateplanCharge.name,
    unit_of_measure: 'AGENTS',
    quantity: productRateplanCharge.default_quantity,
    billing_period: productRateplanCharge.billing_period,
    tiers: [{
      resource_type: 'tier',
      id: paidTier(server, productRateplanCharge.price).id
    }]
  });
}

function createCollaboratorCharge(server, productRateplanCharge) {
  return server.create('charge', {
    name: 'Collaborators',
    unit_of_measure: 'COLLABORATORS',
    quantity: productRateplanCharge.default_quantity,
    billing_period: productRateplanCharge.billing_period,
    tiers: [{
      resource_type: 'tier',
      id: freeTier(server).id
    }]
  });
}

function paidTier(server, price) {
  let result = server.db.tiers.where({ price })[0];

  if (!result) {
    result = server.create('tier', { price });
  }

  return result;
}

function freeTier(server) {
  let price = 0;
  let result = server.db.tiers.where({ price })[0];

  if (!result) {
    result = server.create('tier', { price });
  }

  return result;
}

function paidProductTier(server, price) {
  let result = server.db.productRateplanChargeTiers.where({ price })[0];

  if (!result) {
    result = server.create('product-rateplan-charge-tier', { price });
  }

  return result;
}

function freeProductTier(server) {
  let price = 0;
  let result = server.db.productRateplanChargeTiers.where({ price })[0];

  if (!result) {
    result = server.create('product-rateplan-charge-tier', { price });
  }

  return result;
}
