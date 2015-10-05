var request = require('request');
var Promise = require('bluebird');
var _ = require('underscore');

var URL = "http://wri-01.cartodb.com/api/v2/sql";

var DATES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

var GFW = {
  get: function(method, country) {
    if (this[method] !== undefined) {
      return this[method](country);
    }
  },

  forma: function(country) {
    var url = "http://api.globalforestwatch.org/countries/" + country.iso3;

    return new Promise(function(resolve, reject) {
      request(url, function (err, res, body) {
        if (!err && res.statusCode == 200) {
          body = JSON.parse(body);

          var alerts = body.forma,
              text;

          if (alerts.length > 0) {
            var latestAlert = alerts[alerts.length-1],
                date = new Date(latestAlert.date),
                alertCount = latestAlert.alerts;

            text = "In " + DATES[date.getMonth()] + " " + date.getFullYear() + ", there were " + alertCount + " forma alerts for " + country.name;
          } else {
            text = "There have been no recent Forma alerts.";
          }

          return resolve(text);
        } else {
          return reject(err);
        }
      })
    });
  },

  forest_loss: function(country) {
    var query = "SELECT loss FROM umd_nat_final_1 WHERE iso='" + country.iso3 + "' AND year=2013 AND thresh=30",
        url = URL + "?q=" + query;

    return new Promise(function(resolve, reject) {
      request(url, function (err, res, body) {
        if (!err && res.statusCode == 200) {
          body = JSON.parse(body);

          var value = body.rows[0].loss.toFixed(2),
              text = "In 2013, " + country.name + " lost " + value + " hectares of tree cover";

          return resolve(text);
        } else {
          return reject(err);
        }
      })
    });
  },

  forest_gain: function(country) {
    var query = "SELECT gain FROM umd_nat_final_1 WHERE iso='" + country.iso3 + "' AND year=2013 AND thresh=30",
        url = URL + "?q=" + query;

    return new Promise(function(resolve, reject) {
      request(url, function (err, res, body) {
        if (!err && res.statusCode == 200) {
          body = JSON.parse(body);

          var value = body.rows[0].gain.toFixed(2),
              text = "In 2013, " + country.name + " gained " + value + " hectares of tree cover";

          return resolve(text);
        } else {
          return reject(err);
        }
      })
    });
  }
};

module.exports = GFW;
