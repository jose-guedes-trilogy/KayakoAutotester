//Work around until this is real
//https://github.com/samselikoff/ember-cli-mirage/issues/183
import mirageInitializer from '../../initializers/ember-cli-mirage';

export default function setupMirage(container) {
  mirageInitializer.initialize(container);
}
