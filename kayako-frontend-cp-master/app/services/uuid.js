import Service from '@ember/service';
import uuid from 'npm:uuid/v4';

export default Service.extend({
  uuid() {
    return uuid();
  }
});
