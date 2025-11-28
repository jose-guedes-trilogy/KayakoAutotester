import rowStyles from 'frontend-cp/components/ko-simple-list/row/styles';

export const getCookies = () => find(`.qa-admin-cookie_privacy-list .${rowStyles.row}`);
export const getRegistrations = () => find(`.qa-admin-registration_privacy-list .${rowStyles.row}`);

export const assertRow = (assert, row, [url, options = []]) => {
  assert.ok(row.text().indexOf(`(${url})`) !== -1, url + ' (Url)');
  const isDefault = options.indexOf('isDefault') !== -1;
  assert[isDefault ? 'ok' : 'notOk'](row.text().indexOf('(Default)') !== -1, url + ': (Default)');
    
  triggerEvent(row, 'mouseenter');
  andThen(() => {
    const canEdit = options.indexOf('canEdit') !== -1;
    assert[canEdit ? 'ok' : 'notOk'](row.find('a').text().indexOf('Edit') !== -1, url + ': Can be edited');
    const canDisable = options.indexOf('canDisable') !== -1;
    assert[canDisable ? 'ok' : 'notOk'](row.find('a').text().indexOf('Disable') !== -1, url + ': Can be disabled');

    const canEnable = options.indexOf('canEnable') !== -1;
    assert[canEnable ? 'ok' : 'notOk'](row.find('a').text().indexOf('Enable') !== -1, url + ': Can be enabled');

    const canMakeDefault = options.indexOf('canMakeDefault') !== -1;
    assert[canMakeDefault ? 'ok' : 'notOk'](row.find('a').text().indexOf('Make default') !== -1, url + ': Can be made default');

    const canDelete = options.indexOf('canDelete') !== -1;
    assert[canDelete ? 'ok' : 'notOk'](row.find('a').text().indexOf('Delete') !== -1, url + ': Can be removed');
  });
  triggerEvent(row, 'mouseleave');
};

export const assertRows = (assert, cookieList = [], registrationList = []) => {
  const cookieRows = getCookies();
  const registrationRows = getRegistrations();
  assert.equal(cookieRows.length, cookieList.length, 'Cookie policy url count');
  assert.equal(registrationRows.length, registrationList.length, 'Registration policy url count');
  cookieList.forEach((row, index) => assertRow(assert, cookieRows.eq(index), row));
  registrationList.forEach((row, index) => assertRow(assert, registrationRows.eq(index), row));
};
