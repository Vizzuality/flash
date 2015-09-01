var express = require('express');
var path = require('path');
var logger = require('logfmt');
var config = require('../../config');

var twilio = require('twilio'),
    twilioClient = require('twilio')(config.twilio_sid, config.twilio_secret);

var countries = require('country-data').countries;
var GFW = require('../gfw.js');

module.exports = function(app) {

  var index = function(req, res) {
    res.send("there's nothing here");
  };

  var handleCall = function(req, res, next) {
    var twiml = new twilio.TwimlResponse();

    // helper to append a new "Say" verb with alice voice
    function say(text) {
      twiml.say(text, { voice: 'woman'});
    }

    function pause(length) {
      twiml.pause({length: length});
    }

    // respond with the current TwiML content
    function respond() {
      res.type('text/xml');
      res.send(twiml.toString());
    }

    var userCountry = countries[req.query.CallerCountry],
        iso3 = userCountry.alpha3;

    GFW.getLatestFormaAlert(iso3).then(function(alert) {
      say('Thank you for calling Resource Watch.');
      pause(0.5);
      say('In the last month, there have been 3,227 fires in '+userCountry.name);
      //say('In the last month, there have been '+alert.alerts+' fires in '+userCountry.name);
      pause(0.5);
      say('An SMS containing more details has been sent to your phone. Good bye.');

      twilioClient.sendMessage({
        from: "+13342328283",
        to: req.query.Caller,
        body: "Hey I got you some data, check it out! https://goo.gl/VI51Fr"
      }, function() { /* should handle errors here */ });

      return respond();
    });
  };

  var handleMessage = function(req, res, next) {
  };

  return new express.Router()
    .get('/', index)
    .get('/voice', handleCall)
    .post('/message', handleMessage);

};
