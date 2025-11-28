export default function computeSelected(caseId, checked, alreadySelected, allCaseIds) {
  let toBeSelected = [];
  let allSelected = [];

  // Prepare array of new rows
  const lastSelected = alreadySelected.get('lastObject');
  const topLimit = allCaseIds.indexOf(lastSelected);
  const bottomLimit = allCaseIds.indexOf(caseId);
  const isSelectingUpwards = topLimit > bottomLimit;

  if (isSelectingUpwards) {
    toBeSelected = allCaseIds.filter((el, i) => i <= topLimit && i >= bottomLimit).reverse();
  } else {
    toBeSelected = allCaseIds.filter((el, i) => i >= topLimit && i <= bottomLimit);
  }

  // Concatinate new rows to the previously selected rows
  if (checked) {
    allSelected = (alreadySelected.concat(toBeSelected)).uniq();
  } else {
    allSelected = alreadySelected.reject(el => toBeSelected.includes(el));
  }

  return allSelected;
}
