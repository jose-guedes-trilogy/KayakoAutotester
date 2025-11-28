// To use it create some files under `mocks/`
// e.g. `server/mocks/ember-hamsters.js`
//
// module.exports = function(app) {
//   app.get('/ember-hamsters', function(req, res) {
//     res.send('hello');
//   });
// };

const winston = require('winston');
const expressWinston = require('express-winston');

module.exports = function(app) {
  var globSync   = require('glob').sync;
  var mocks      = globSync('./mocks/**/*.js', { cwd: __dirname }).map(require);
  var proxies    = globSync('./proxies/**/*.js', { cwd: __dirname }).map(require);

  // Log proxy requests
  var morgan  = require('morgan');
  app.use(morgan('dev'));

  mocks.forEach(function(route) { route(app); });
  proxies.forEach(function(route) { route(app); });
  require('./locales')(app);

  if (process.env.API_LOGGING) {
    app.use(expressWinston.logger({
      ignoreRoute: function(req, res) {
        return !req.url.match(/^\/api/);
      },
      transports: [
         new winston.transports.File({
           filename: 'api-requests.log',
           json: true
         })
       ]
    }));
  }
};
