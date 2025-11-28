import Service from '@ember/service';
import { getOwner } from '@ember/application';

export default Service.extend({
  download(report) {
    const id = report.get('id');
    const adapter = getOwner(this).lookup('adapter:application');
    const url = `${adapter.namespace}/reports/${id}/download`;
    window.location = url;
  }
});
