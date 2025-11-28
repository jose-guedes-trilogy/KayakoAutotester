import { registerHelper } from '@ember/test';

export default registerHelper('textNodesToArray', function(app, selector) {
  let nodes = [];
  $(selector).each((index, item) => {
    nodes.push($(item).text().trim());
  });

  return nodes;
});
