export default {
  subscription: {
    'id': '2c92c0f85460115f0154703a27433b7e',
    'status': 'EXPIRED',
    'account': {
      'id': '2c92c0f8546011510154711e81cd009c',
      'resource_type': 'account'
    },
    'rateplans': [{
      'id': '2c92c0f85460115f0154703a27883b8e',
      'resource_type': 'rateplan'
    }],
    'resource_type': 'subscription',
  },
  'resources': {
    'account': {
        '2c92c0f8546011510154711e81cd009c': {
            'id': '2c92c0f8546011510154711e81cd009c',
            'number': 'A00000637',
            'name': 'Sims',
            'status': 'ACTIVE',
            'sold_to': {
                'id': '2c92c0f84cff94f2014d0b007a4432fd',
                'resource_type': 'contact'
            },
            'bill_to': {
                'id': '2c92c0f84cff94f2014d0b007a4432fd',
                'resource_type': 'contact'
            },
            'billing': {
                'id': null,
                'auto_pay': false,
                'default_payment_method': '2c92c0f954a3777e0154a511bc50495b',
                'bill_cycle_day': 1,
                'payment_term': 'NET30',
                'currency': 'USD',
                'purchase_order_number': null,
                'communication_profile_name': 'Default Profile',
                'resource_type': 'billing',
                'resource_url': null
            },
            'total_invoice_balance': 0,
            'credit_balance': 0,
            'balance': 0,
            'crm_id': null,
            'vat_id': null,
            'sales_representative': null,
            'tax_exempt_status': 'NO',
            'tax_exempt_certificate_id': null,
            'tax_exempt_certificate_type': null,
            'tax_exempt_description': null,
            'tax_exempt_issuing_jurisdiction': null,
            'resource_type': 'account'
        }
    },
    'charge': {
      '2c92c0f85460115f0154703a27883b8f': {
        'id': '2c92c0f85460115f0154703a27883b8f',
        'unit_of_measure': 'AGENTS',
        'quantity': 10,
        'is_last_segment': true,
        'billing_period': 'MONTH',
        'tier': [{
            'id': '2c92c0f85460115f0154703a277d3b8a',
            'resource_type': 'tier'
        }],
        'resource_type': 'charge'
      },
      '2c92c0f85460115f0154703a27883b90': {
        'id': '2c92c0f85460115f0154703a27883b90',
        'unit_of_measure': 'COLLABORATORS',
        'quantity': 2,
        'billing_period': 'MONTH',
        'tier': [{
          'id': '2c92c0f85460115f0154703a27853b8c',
          'resource_type': 'tier'
        }],
        'resource_type': 'charge'
      }
    },
    'contact': {
         '2c92c0f84cff94f2014d0b007a4432fd': {
             'id': '2c92c0f84cff94f2014d0b007a4432fd',
             'first_name': 'Jordan',
             'last_name': 'Mitchell',
             'address1': '12D Surrey',
             'address2': '',
             'city': 'California',
             'state': 'New York',
             'county': '',
             'country': 'Canada',
             'postal_code': 122002,
             'tax_region': '',
             'work_phone': '',
             'mobile_phone': '',
             'home_phone': '',
             'personal_email': 'jordan.mitchell@brewfictus.com',
             'work_email': 'jordan.mitchell@brewfictus.com',
             'resource_type': 'contact'
         }
    },
    'product_rateplan': {
      '2c92c0f84d658e8e014d6d4462b07a8e': {
        'id': '2c92c0f84d658e8e014d6d4462b07a8e',
        'key': 'standard',
        'type': 'PRIMARY',
        'charges': [
          {
            'id': '2c92c0f84d658e8e014d6d4462c57a90',
            'resource_type': 'product_rateplan_charge'
          },
          {
            'id': '2c92c0f84fbac226014fcb451b477707',
            'resource_type': 'product_rateplan_charge'
          }
        ],
        'resource_type': 'product_rateplan',
      }
    },
    'product_rateplan_charge': {
      '2c92c0f84d658e8e014d6d4462c57a90': {
        'id': '2c92c0f84d658e8e014d6d4462c57a90',
        'unit_of_measure': 'AGENTS',
        'default_quantity': 1,
        'billing_period': 'MONTH',
        'tiers': [{
          'id': '2c92c0f84d658e8e014d6d4462c67a91',
          'resource_type': 'product_rateplan_charge_tier'
        }],
        'resource_type': 'product_rateplan_charge'
      },
      '2c92c0f84fbac226014fcb451b477707': {
        'id': '2c92c0f84fbac226014fcb451b477707',
        'unit_of_measure': 'COLLABORATORS',
        'default_quantity': 2,
        'billing_period': 'MONTH',
        'tiers': [{
          'id': '2c92c0f84fbac226014fcb451b477708',
          'resource_type': 'product_rateplan_charge_tier'
        }],
        'resource_type': 'product_rateplan_charge'
      }
    },
    'product_rateplan_charge_tier': {
      '2c92c0f84d658e8e014d6d4462c67a91': {
        'id': '2c92c0f84d658e8e014d6d4462c67a91',
        'currency': 'USD',
        'starting_unit': 0,
        'ending_unit': null,
        'price': 31,
        'price_format': 'PERUNIT',
        'tier': 1,
        'resource_type': 'product_rateplan_charge_tier'
      },
      '2c92c0f84fbac226014fcb451b477708': {
        'id': '2c92c0f84fbac226014fcb451b477708',
        'currency': 'USD',
        'starting_unit': 0,
        'ending_unit': null,
        'price': 0,
        'price_format': 'PERUNIT',
        'tier': 1,
        'resource_type': 'product_rateplan_charge_tier'
      }
    },
    'rateplan': {
      '2c92c0f85460115f0154703a27883b8e': {
        'id': '2c92c0f85460115f0154703a27883b8e',
        'product_rateplan': {
            'id': '2c92c0f84d658e8e014d6d4462b07a8e',
            'resource_type': 'product_rateplan'
        },
        'charges': [
          {
            'id': '2c92c0f85460115f0154703a27883b8f',
            'resource_type': 'charge'
          },
          {
            'id': '2c92c0f85460115f0154703a27883b90',
            'resource_type': 'charge'
          }
        ],
        'resource_type': 'rateplan',
      }
    }
  }
};
