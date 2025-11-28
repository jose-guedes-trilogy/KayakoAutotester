import { registerAsyncHelper } from '@ember/test';

const OVERSHOOT = 2;

export function reorder(app, itemSelector, elementSelector, ...resultSelectors) {
  const {
    andThen,
    drag,
    findWithAssert,
    wait
  } = app.testHelpers;

  resultSelectors.forEach((selector, targetIndex) => {
    andThen(() => {
      let items = findWithAssert(itemSelector);
      let element = items.filter((index, element) => { return $(element).parent().find(elementSelector).val() === selector; });
      let targetElement = items.eq(targetIndex);
      let dx = targetElement.offset().left - OVERSHOOT - element.offset().left;
      let dy = targetElement.offset().top - OVERSHOOT - element.offset().top;

      drag('mouse', element, () => { return { dx: dx, dy: dy }; });
    });
  });

  return wait();
}

export default registerAsyncHelper('reorderInputs', reorder);
