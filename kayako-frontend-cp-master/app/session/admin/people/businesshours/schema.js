import { attr, list, many, model } from 'frontend-cp/services/virtual-model';

export default model('business-hour', {
  title: attr(),
  zones: model('zone', {
    monday: list(),
    tuesday: list(),
    wednesday: list(),
    thursday: list(),
    friday: list(),
    saturday: list(),
    sunday: list()
  }),
  holidays: many(model('businesshour-holiday', {
    title: attr(),
    date: attr(),
    openHours: list()
  }))
});
