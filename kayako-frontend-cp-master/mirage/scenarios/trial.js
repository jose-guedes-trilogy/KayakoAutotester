import moment from 'moment';

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
 * - A Plan
 *
 * It’s actually a little bit of a kludge to have an entry in the db for Plan
 * because in reality it’s a composite of a bunch of other resources and bits
 * of config. There’s the risk that it could get out of sync with the things it
 * composes.
 *
 * However, for now it’ll do.
 *
 * @function trialScenario
 * @param {Mirage.Server} server
 * @returns {null}
 */
export default function trialScenario(server) {
  let product = createProduct(server);
  let productRateplans = createProductRateplans(server, product);

  createPlan(server, productRateplans[0]);
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

function createPlan(server, productRateplan) {
  return server.create('plan', {
    name: productRateplan.label,
    lead_id: '00Q1000000L6Q1oEAF',
    opportunity_id: '',
    account_id: '',
    subscription_id: '',
    rateplan_id: productRateplan.id,
    is_grandfathered: false,
    expiry_at: moment().add(30, 'days').toDate(),
    product: productRateplan.product
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
