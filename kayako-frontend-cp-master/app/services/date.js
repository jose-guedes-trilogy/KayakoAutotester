import Service from '@ember/service';

//This service exists only to allow times to be fixed in tests
export default Service.extend({
  getNewDate(dateTime) {
    return new Date(dateTime);
  },
  getCurrentDate() {
    return new Date();
  }
});
