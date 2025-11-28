import Service from '@ember/service';
import { task } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { getOwner } from '@ember/application';
import config from 'frontend-cp/config/environment';
import _ from 'npm:lodash';

// const debounceTime = 1000;

export default Service.extend({
    // Constants
    STATUS_OPEN : 'open',
    STATUS_ABANDONED : 'abandoned',
    STATUS_FULFILLED :'converted',

    session: service(),
    store: service(),
    user: computed.readOnly('session.user'),
    billingStatus: {},

    init() {
      let brand = this.get('store').peekAll('brand').findBy('isDefault', true);
      this.set('brand', brand);    
      const company = this.get('brand.subDomain');
      const instanceId = this.get('session.session.instanceId');
      const domain = `https://${this.get('brand.subDomain')}.${this.get('brand.domain')}`;
      this.set('billingStatus', {company, instanceId, domain});
    },
    
    initUpdateCart: task(function * (that, status = this.get('STATUS_OPEN')) {

      // yield timeout(debounceTime); //don't uncomment, otherwise we will lose some logs

      const name = ''; // The billing information will have it's own fields
      const email = ''; // The billing information will have it's own fields
      const phone = that.get('billing.home_phone');

      // billing information
      const billingFirstName = that.get('billing.first_name');
      const billingLastName = that.get('billing.last_name');
      const billingEmail = that.get('billing.personal_email');
      const billingPhone = that.get('billing.home_phone');
      const billingAddress1 = that.get('billing.address1');
      const billingAddress2 = that.get('billing.address2');
      const billingCity = that.get('billing.city');
      const billingState = that.get('billing.state');
      const billingPostalCode = that.get('billing.postal_code');
      const billingCountry = that.get('billing.country');
      const billingInformation = {billingFirstName, billingLastName, billingEmail, billingPhone, billingAddress1, billingAddress2, billingCity, billingState, billingPostalCode, billingCountry};

      const seats = that.get('selectedNumberOfSeats');
      const cartValue = that.get('subscriptionAmount');
      const plan = that.get('selectedPlan.label');
      const planId = that.get('selectedPlan.productId');
  
      this.updateCart(_.merge(billingInformation, {status, name, email, plan, planId, phone, seats, cartValue}));
    }).keepLatest(),

    updateCart({billingFirstName, billingLastName, billingEmail, billingPhone, billingAddress1, billingAddress2, billingCity, billingState, billingPostalCode, billingCountry, status, name, email, plan, planId, phone, seats, cartValue}) { // this is here to keep track of all the parameters we have
      email = email || this.get('user.primaryEmailAddress');
      name = name || this.get('user.fullName');
      
      let billingStatus = this.get('billingStatus');
      billingStatus = _.merge(billingStatus, {status, name, email, plan, planId, phone, seats, cartValue, billingFirstName, billingLastName, billingEmail, billingPhone, billingAddress1, billingAddress2, billingCity, billingState, billingPostalCode, billingCountry});
      this.set('billingStatus', billingStatus);
      const adapter = getOwner(this).lookup('adapter:application');
      const data = billingStatus;
      adapter.ajax(`${config.cartServiceBaseUrl}/api/cartlog/save`, 'POST', { data });
    }
});
