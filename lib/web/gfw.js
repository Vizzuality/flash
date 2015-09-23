var request = require('request');
var Promise = require('bluebird');

var URL = "http://api.globalforestwatch.org/countries/";

var GFW = {
  get: function(country) {
    return "Since 2013, the " + country.name + " has lost 1.6 mega hectares of tree cover";
  },

  getFormaAlerts: function(iso3) {
    iso3 = "BRA";

    return new Promise(function(resolve, reject) {
      var url = URL + iso3;
      request(url, function (err, res, body) {
        if (!err && res.statusCode == 200) {
          return resolve(body.forma || []);
        } else {
          return reject(err);
        }
      })
    });
  },

  getLatestFormaAlert: function(iso3) {
    return new Promise(function(resolve, reject) {
      this.getFormaAlerts(iso3).then(function(alerts) {
        var lastAlert = alerts[alerts.length-1];
        resolve(lastAlert)
      });
    }.bind(this));
  }
};

module.exports = GFW;
