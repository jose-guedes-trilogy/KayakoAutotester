function createViewForAllSlas(server) {
  let columns = [
    server.create('column', {
      title: 'Case ID',
      name: 'caseid'
    }),
    server.create('column', {
      title: 'Subject',
      name: 'subject'
    }),
    server.create('column', {
      title: 'SLA',
      name: 'slaversionid'
    }),
    server.create('column', {
      title: 'First Reply',
      name: 'slafirstreplytime'
    }),
    server.create('column', {
      title: 'Resolution',
      name: 'slaresolutiontime'
    }),
    server.create('column', {
      title: 'Next Breach',
      name: 'slanextbreach'
    }),
  ];

  return server.create('view', {
    title: 'Show all SLA columns',
    is_default: false,
    is_enabled: true,
    columns: columns,
    sort_order: 1,
    type: 'CUSTOM'
  });
}

export { createViewForAllSlas };
