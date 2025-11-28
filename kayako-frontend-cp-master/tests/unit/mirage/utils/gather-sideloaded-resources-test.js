import { module, test } from 'qunit';
import gatherSideloadedResources from 'frontend-cp/mirage/utils/gather-sideloaded-resources';

module('Mirage | Utils | gather-sideloaded-resources');

class MockCollection {
  constructor(contents) {
    this.contents = contents;
  }

  find(id) {
    return this.contents.find(item => item.id === id);
  }
}

test('gatherSideloadedResources(subscription)', assert => {
  let db = {
    subscriptions: new MockCollection([{
      resource_type: 'subscription',
      id: 'subscription-1',
      name: 'Subscription 1',
      account: {
        id: 'account-1',
        resource_type: 'account'
      },
      invoice_owner: {
        id: 'account-2',
        resource_type: 'account'
      },
      rateplans: [{
        id: 'rateplan-1',
        resource_type: 'rateplan'
      }]
    }]),
    accounts: new MockCollection([{
      resource_type: 'account',
      id: 'account-1',
      name: 'Account 1'
    }, {
      resource_type: 'account',
      id: 'account-2',
      name: 'Account 2'
    }]),
    rateplans: new MockCollection([{
      resource_type: 'rateplan',
      id: 'rateplan-1',
      name: 'Rateplan 1',
      charges: [{
        id: 'charge-1',
        resource_type: 'charge'
      }],
      product_rateplan: {
        id: 'product-rateplan-1',
        resource_type: 'product_rateplan'
      }
    }]),
    charges: new MockCollection([{
      resource_type: 'charge',
      id: 'charge-1',
      name: 'Charge 1',
      tiers: [{
        id: 'tier-1',
        resource_type: 'tier'
      }]
    }]),
    tiers: new MockCollection([{
      resource_type: 'tier',
      id: 'tier-1',
      name: 'Tier 1'
    }]),
    productRateplans: new MockCollection([{
      resource_type: 'product_rateplan',
      id: 'product-rateplan-1',
      name: 'Product Rateplan 1'
    }])
  };
  let subscription = db.subscriptions.find('subscription-1');
  let result = gatherSideloadedResources(db, [subscription]);

  assert.deepEqual(result, {
    account: {
      'account-1': {
        resource_type: 'account',
        id: 'account-1',
        name: 'Account 1'
      },
      'account-2': {
        resource_type: 'account',
        id: 'account-2',
        name: 'Account 2'
      }
    },
    rateplan: {
      'rateplan-1': {
        resource_type: 'rateplan',
        id: 'rateplan-1',
        name: 'Rateplan 1',
        charges: [{
          id: 'charge-1',
          resource_type: 'charge'
        }],
        product_rateplan: {
          id: 'product-rateplan-1',
          resource_type: 'product_rateplan'
        }
      }
    },
    charge: {
      'charge-1': {
        resource_type: 'charge',
        id: 'charge-1',
        name: 'Charge 1',
        tiers: [{
          id: 'tier-1',
          resource_type: 'tier'
        }]
      }
    },
    tier: {
      'tier-1': {
        resource_type: 'tier',
        id: 'tier-1',
        name: 'Tier 1'
      }
    },
    product_rateplan: {
      'product-rateplan-1': {
        resource_type: 'product_rateplan',
        id: 'product-rateplan-1',
        name: 'Product Rateplan 1'
      }
    }
  }, 'returns sideloaded resource in expected format');
});

test('gatherSideloadedResources(posts)', assert => {
  let db = {
    posts: new MockCollection([{
      resource_type: 'post',
      id: 'post-1',
      name: 'Post 1',
      original: {
        id: 'activity-1',
        resource_type: 'activity'
      }
    }]),
    activities: new MockCollection([{
      resource_type: 'activity',
      id: 'activity-1',
      name: 'Activity 1',
      object: {
        original: {
          id: 'event-1',
          resource_type: 'event'
        }
      }
    }]),
    events: new MockCollection([{
      resource_type: 'event',
      id: 'event-1',
      name: 'Event 1'
    }])
  };
  let post = db.posts.find('post-1');
  let result = gatherSideloadedResources(db, [post]);

  assert.deepEqual(result, {
    activity: {
      'activity-1': {
        resource_type: 'activity',
        id: 'activity-1',
        name: 'Activity 1',
        object: {
          original: {
            id: 'event-1',
            resource_type: 'event'
          }
        }
      }
    },
    event: {
      'event-1': {
        resource_type: 'event',
        id: 'event-1',
        name: 'Event 1'
      }
    }
  }, 'returns sideloaded resource in expected format');
});
