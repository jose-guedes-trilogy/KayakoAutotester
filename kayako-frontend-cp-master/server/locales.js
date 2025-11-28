var fs = require('fs');
var path = require('path');
var express = require('express');
var _ = require('lodash');

module.exports = function(app) {
  var router = express.Router();

  router.get('/current', function (req, res) {
    res.send({
      "status": 200,
      "data": {
        "locale": "en-us",
        "name": "English (United States)",
        "native_name": "English (United States)",
        "region": "US",
        "native_region": "United States",
        "script": "",
        "variant": "",
        "direction": "LTR",
        "is_enabled": true,
        "created_at": "2015-05-28T14:12:59Z",
        "updated_at": "2015-05-28T14:12:59Z",
        "resource_type": "locale"
      },
      "resource": "locale"
    });
  });

  router.get('/1/strings', function(req, res) {
    fs.readdir('./app/locales/en-us', function (err, files) {
      var strings = [];
      var notifications = [];
      files.forEach(function (filename) {
        var file = fs.readFileSync('./app/locales/en-us/' + filename);
        try {
          var json = JSON.parse(file);
          var prefixName = path.basename(filename, '.json');
          _.each(json, function (value, key) {
            strings.push({
              id: 'frontend.api.' + prefixName + '.' + key,
              value: value,
              resource_type: "locale_string"
            })
          })
        } catch (e) {
          notifications.push({
            type: 'error',
            message: 'Error parsing locale file ' + filename + ': ' + e.toString()
          });
        }
      });
      res.send({
        "status": 200,
        "data": strings,
        "resource": "locale_string",
        notifications: notifications
      });
    });
  });

  app.use('/api/v1/locales', router);
};
