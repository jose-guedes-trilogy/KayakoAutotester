import { Factory, faker } from 'ember-cli-mirage';

export default Factory.extend({
  resource_type: 'plan',
  name: 'Growth',
  lead_id: '',
  opportunity_id: '',
  account_id: null,
  subscription_id: null,
  rateplan_id: null,
  is_grandfathered: false,
  expiry_at: faker.date.future,
  product: null,
  features: [{
    code: 'case_forms',
    resource_type: 'product_feature'
  }, {
    code: 'shared_organizations',
    resource_type: 'product_feature'
  }, {
    code: 'agent_collision',
    resource_type: 'product_feature'
  }, {
    code: 'multi_language',
    resource_type: 'product_feature'
  }, {
    code: 'insights_sla',
    resource_type: 'product_feature'
  }, {
    code: 'shared_custom_views',
    resource_type: 'product_feature'
  }, {
    code: 'kayako_for_salesforce_app',
    resource_type: 'product_feature'
  }, {
    code: 'edit_views',
    resource_type: 'product_feature'
  }],
  limits: {
    slas: 999,
    business_hours: 999,
    brands: 2,
    agents: 10,
    collaborators: 999,
    api_rate_limit: 400,
    attachment_size_limit: 20,
    resource_type: 'plan_limit'
  },
  billing: {
    hosted_page_id: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    hosted_page_url: 'https://apisandbox.zuora.com/apps/PublicHostedPageLite.do',
    payment_gateway: 'emberApp',
    resource_type: 'billing'
  }
});
