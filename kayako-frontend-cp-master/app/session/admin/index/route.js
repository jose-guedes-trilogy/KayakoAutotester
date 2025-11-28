import Route from '@ember/routing/route';
import { variation } from 'ember-launch-darkly';

export default Route.extend({
   redirect() {
     if (!variation('release-admin-landing-page')) {
       this.transitionTo('session.admin.people.staff');
     }
   }
});
