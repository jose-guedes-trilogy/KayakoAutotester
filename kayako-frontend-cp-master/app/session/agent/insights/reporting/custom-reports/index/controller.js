import Controller from '@ember/controller';

export default Controller.extend({
  queryParams: ['page'],
  page: 1,

  actions: {
    editReport(report) {
      this.transitionToRoute('session.agent.insights.reporting.custom-reports.edit', report.get('id'));
    },

    newReport() {
      this.transitionToRoute('session.agent.insights.reporting.custom-reports.new');
    }
  }
});
