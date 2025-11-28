import { registerHelper } from '@ember/test';

export default registerHelper('inputArrayToInputValArray', function(app, selector) {
  let titles = [];

  $(selector).each((index, item) => {
    titles.push($(item).val());
  });

  return titles;
});
