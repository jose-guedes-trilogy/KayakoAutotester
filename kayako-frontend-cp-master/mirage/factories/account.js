import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  resource_type: 'account',
  number: 'A00000781',
  name: 'Test Account',
  status: 'ACTIVE', // ACTIVE|DRAFT|CANCELLED
  sold_to: null,
  bill_to: null,
  billing: {
    resource_type: 'billing',
    auto_pay: false,
    default_payment_method: null,
    bill_cycle_day: 1,
    payment_term: 'NET15',
    currency: 'USD',
    purchase_order_number: null,
    communication_profile_name: 'Default Profile'
  },
  total_invoice_balance: 10295.66,
  credit_balance: 275.97,
  balance: 10019.69,
  crm_id: null,
  vat_id: null,
  sales_representative: null,
  tax_exempt_status: 'NO',
  tax_exempt_certificate_id: null,
  tax_exempt_certificate_type: null,
  tax_exempt_description: null,
  tax_exempt_issuing_jurisdiction: null
});
