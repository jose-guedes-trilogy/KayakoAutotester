import Service, { inject as service } from '@ember/service';
import moment from 'moment';
import _ from 'npm:lodash';

export default Service.extend({
  i18n: service(),
  store: service(),

  transformRatePlans (ratePlans) {
    if (ratePlans.toArray) {
      ratePlans = ratePlans.toArray();
    }

    return _(ratePlans)
    .groupBy(ratePlan => ratePlan.get('key'))
    .map(ratePlan => this._getRatePlanNode(ratePlan))
    .sortBy('ANNUAL.price')
    .value();
  },

  transformRateplansWithLegacy(rateplans) {
    if (!rateplans) {
      return null;
    }

    let latest = rateplans.filter(rateplan => rateplan.get('product.isLatest'));
    let legacy = rateplans.filter(rateplan => !rateplan.get('product.isLatest'));

    latest = this.transformRatePlans(latest);
    legacy = this.transformRatePlans(legacy);

    return { latest, legacy };
  },

  getTermDiscount (ratePlans, term) {
    if (!ratePlans) {
      return {fixed: 0, percentage: 0};
    }
    return _(ratePlans.toArray())
    .filter((rateplan) => {
      return _.find(rateplan.get('charges').toArray(), (charge) => {
        return charge.get('billingPeriod') === term && this.isDiscount(charge);
      });
    })
    .map((rateplan) => rateplan.get('charges').toArray())
    .flatten()
    .transform((result, charge) => {
      if (this.isFixedDiscount(charge)) {
        result.fixed = parseInt(charge.get('defaultQuantity'));
      } else if (charge && this.isPercentageDiscount(charge)) {
        result.percentage = parseInt(charge.get('defaultQuantity'));
      }
      return result;
    }, {fixed: 0, percentage: 0})
    .value();
  },

  calculatePercentage (base, percentage) {
    return (base * percentage) / 100;
  },

  getDiscount (total, fixedDiscount, discountPercentage) {
    const totalAfterFixedDiscount = total - fixedDiscount;
    return (this.calculatePercentage(totalAfterFixedDiscount, discountPercentage)) + fixedDiscount;
  },

  isFixedDiscount (charge) {
    return charge.get('model') === 'DISCOUNTFIXEDAMOUNT';
  },

  isPercentageDiscount (charge) {
    return charge.get('model') === 'DISCOUNTPERCENTAGE';
  },

  isDiscount (charge) {
    return this.isFixedDiscount(charge) || this.isPercentageDiscount(charge);
  },

  _getRatePlanNode (ratePlan) {
    return _.transform(ratePlan, (result, ratePlan) => this._setCharges(result, ratePlan), {});
  },

  _setCharges (result, ratePlan) {
    const charge = this._getDisplayCharge(ratePlan);
    const chargeNode = charge.billingPeriod;
    result.label = ratePlan.get('label');
    result.key = ratePlan.get('key');
    result.description = ratePlan.get('description');
    result.minimum_amount_notification = ratePlan.get('minimum_amount_notification');
    result.minimum_purchase_amount = ratePlan.get('minimum_purchase_amount');
    result.currency = charge.currency;
    result.productId = ratePlan.get('product.id');
    result[chargeNode] = charge;
  },

  _getDisplayCharge (rateplan) {
    const rateplanId = rateplan.get('id');
    const chargesArray = rateplan.get('charges').toArray();

    return _.reduce(chargesArray, (result, charge) => {
      if (charge.get('unitOfMeasure') === 'AGENTS') {
        result = _.assign(result, this._getAgentCharge(charge, rateplanId));
      } else if (charge.get('unitOfMeasure') === 'COLLABORATORS') {
        result = _.assign(result, this._getCollaboratorCharge(charge, rateplanId));
      } else {
        // TODO: FIX IT LATER, NEED TO HAVE A FALLBACK
        // result = _.assign(result, this._getAgentCharge(charge, rateplanId));
      }
      return result;
    }, {});
  },

  _getAgentCharge (charge, parentId) {
    const priceTier = this._getDisplayTier(charge);
    return _.assign({
      actualId: parentId,
      price: this._getRatePlanUnitFee(priceTier.unitFee, charge.get('billingPeriod')) || priceTier.flatFee,
      actualPrice: priceTier.unitFee || priceTier.flatFee,
      billingPeriod: charge.get('billingPeriod')
    }, priceTier);
  },

  _getCollaboratorCharge (charge, parentId) {
    return {
      actualId: parentId,
      collaborators: charge.get('defaultQuantity'),
      billingPeriod: charge.get('billingPeriod')
    };
  },

  /*
   * returns unit fee for a rateplan based upon the
   * billingPeriod. Annual one get's a division
   * by 12 (no. of months).
   */
  _getRatePlanUnitFee (fee, billingPeriod) {
    return billingPeriod === 'ANNUAL' ? Math.ceil(fee / 12) : fee;
  },

  _getDisplayTier (charge) {
    const tiersArray = charge.get('tiers').toArray();
    return _.reduce(tiersArray, (result, tier) => {
      if (tier.get('priceFormat') === 'PERUNIT') {
        result = _.assign(result, this._getPerUnitTier(tier, tier.get('currency')));
      } else if (tier.get('priceFormat') === 'FLATFEE') {
        result = _.assign(result, this._getFlatFeeTier(tier, tier.get('currency')));
      }
      return result;
    }, {});
  },

  _getPerUnitTier (tier, currency) {
    return {
      currency: currency,
      unitFee: tier.get('price'),
      maxUnits: tier.get('endingUnit'),
      flatFee: 0,
      flatUpto: 0
    };
  },

  _getFlatFeeTier (tier, currency) {
    return {
      currency: currency,
      flatFee: tier.get('price'),
      flatUpto: tier.get('endingUnit'),
      unitFee: 0,
      maxUnits: 0
    };
  },

  /*
   * returns annual savings for a given plan and the
   * current number of seats.
   */
  getAnnualSavings (plan, agentsCount) {
    if (!plan || !plan.MONTH || !plan.ANNUAL) {
      return 0;
    }
    return ((plan.MONTH.price - plan.ANNUAL.price) * 12) * agentsCount;
  },

  /*
   * returns total for a given plan, term and number of
   * required agents
   */
  getSubscriptionTotal (plan, term, agentsCount) {
    return plan[term].actualPrice * agentsCount;
  },

  /*
   * return the quantity from the last node of charges
   * where unitOfMeasure is AGENTS.
   *
   * @param  {Array} charges
   *
   * @return {Number}
   */
  getAgentsQuantity (charges) {
    const agentCharge = _.last(_.filter(charges.toArray(), (charge) => charge.get('unitOfMeasure') === 'AGENTS' && charge.get('isLastSegment')));
    return agentCharge ? agentCharge.get('quantity') : 0;
  },

  /*
   * return the quantity from the last node of charges
   * where unitOfMeasure is COLLABORATORS.
   *
   * @param  {Array} charges
   *
   * @return {Number}
   */
  getCollaboratorsQuantity (charges) {
    const collaboratorCharge = _.last(_.filter(charges.toArray(), (charge) => charge.get('unitOfMeasure') === 'COLLABORATORS' && charge.get('isLastSegment')));
    return collaboratorCharge ? collaboratorCharge.get('quantity') : 0;
  },

  /*
   * returns renewal date for a given term
   */
  getRenewalDate (term) {
    const termMonths = term === 'MONTH' ? 1 : 12;
    return moment().add(termMonths, 'months');
  },

  /*
   * returns gross total for a given country and vatId
   */
  getGrossTotal (total, country, vatId) {
    if (this._countryAlwaysChargeVat(country)) {
      return total + this._calculateVat(total);
    } else if (this.countryHasVat(country) && !vatId) {
      return total + this._calculateVat(total);
    } else {
      return total;
    }
  },

  /*
   * returns whether country charges vat, no matter what
   */
  _countryAlwaysChargeVat (country) {
    return ['UK', 'GB'].indexOf(country) > -1;
  },

  /*
   * returns whether country charges vat or not
   */
  countryHasVat (country) {
    return ['UK', 'AT', 'BE', 'GB', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'EL', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'BG', 'GR'].indexOf(country) > -1;
  },

  /*
   * calculates vat on a given total
   */
  _calculateVat (amount) {
    const percentageCharged = 20;
    return (amount * percentageCharged) / 100;
  },

  getUpgradePayload (rateplan, newAgentsCount, selectedCollaborators) {
    if (!rateplan) {
      return [];
    }
    return [{
      product_rateplan_id: rateplan.get('id'),
      charges: this.getUpgradeCharges(rateplan, newAgentsCount, selectedCollaborators)
    }];
  },

  getUpgradeCharges (rateplan, newAgentsCount, selectedCollaborators) {
    return _.reduce(rateplan.get('charges').toArray(), (result, charge) => {
      if (charge.get('unitOfMeasure') === 'AGENTS') {
        result.push({
          product_rateplan_charge_id: charge.get('id'),
          quantity: newAgentsCount
        });
      }

      if (charge.get('unitOfMeasure') === 'COLLABORATORS') {
        result.push({
          product_rateplan_charge_id: charge.get('id'),
          quantity: selectedCollaborators
        });
      }

      return result;
    }, []);
  },

  getTerms (rateplans) {
    return _.uniq(_.reduce(rateplans.toArray(), (terms, rateplan) => {
      const rateplansTerms = _.map(rateplan.get('charges').toArray(), (charge) => {
        return charge.get('billingPeriod');
      });
      terms = terms.concat(rateplansTerms);
      return terms;
    }, []));
  },

  getTermItem (key) {
    return {
      value: key,
      label: this.get('i18n').t(`account.plans.terms.${key}`)
    };
  },

  getSeatsLimit (plan, term) {
    const defaultLimit = 999;
    if (!plan || !plan[term]) {
      return defaultLimit;
    }
    return plan[term].unitFee ? defaultLimit : plan[term].flatUpto;
  },

  getSubscriptionRatePlan (rateplans) {
    if (rateplans !== undefined) {
      return _.find(rateplans.toArray(), rateplan => rateplan.get('productRateplan.productRateplanType') === 'PRIMARY') || null;
    }

    return null;
  }
});
