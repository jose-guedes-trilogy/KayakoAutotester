/**
 * This scenario creates two discount rateplans for the passed product.
 * If no product is passed, the first one in the DB is used.
 *
 * If creates the following resources:
 *
 * - Discount monthly rateplan
 * - Discount annual rateplan
 * 
 * And the charges and charge tiers to go with them.
 *
 * @function discountScenario
 * @param {Mirage.Server} server
 * @returns {null}
 */
export default function discountScenario(server, product) {
  if (!product) {
    product = server.db.products[0];
  }

  if (!product) {
    throw new Error('This discount scenario requires a product');
  }

  let standardTier = server.create('product-rateplan-charge-tier', {
    starting_unit: 0,
    ending_unit: null,
    price: 31,
    price_format: 'PERUNIT',
  });

  let discountTier = server.create('product-rateplan-charge-tier', {
    starting_unit: 1,
    ending_unit: 3,
    price: 12,
    price_format: 'FLATFEE',
  });

  let monthlyCharge = server.create('product-rateplan-charge', {
    name: 'Discount - Monthly',
    model: 'DISCOUNTPERCENTAGE',
    unit_of_measure: 'DISCOUNT',
    default_quantity: 15,
    billing_period: 'MONTH',
    tiers: [{
      resource_type: 'product_rateplan_charge_tier',
      id: standardTier.id
    }]
  });

  let annualCharge = server.create('product-rateplan-charge', {
    name: 'Discount - Annually',
    type: 'RECURRING',
    model: 'DISCOUNTPERCENTAGE',
    unit_of_measure: 'DISCOUNT',
    default_quantity: 8,
    billing_period: 'ANNUAL',
    tiers: [{
      resource_type: 'product_rateplan_charge_tier',
      id: discountTier.id
    }]
  });

  server.create('product-rateplan', {
    name: 'Discount - Monthly',
    type: 'DISCOUNT',
    key: 'discount',
    label: 'Discount',
    product: {
      resource_type: 'product',
      id: product.id
    },
    charges: [{
      resource_type: 'product_rateplan_charge',
      id: monthlyCharge.id
    }]
  });

  server.create('product-rateplan', {
    name: 'Discount - Annual',
    type: 'DISCOUNT',
    key: 'discount',
    label: 'Discount',
    product: {
      resource_type: 'product',
      id: product.id
    },
    charges: [{
      resource_type: 'product_rateplan_charge',
      id: annualCharge.id
    }]
  });
}
