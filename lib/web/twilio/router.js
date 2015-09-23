var express = require('express');
var path = require('path');
var logger = require('logfmt');
var config = require('../../config');
var _ = require('underscore');

var twilio = require('twilio'),
    twilioClient = require('twilio')(config.twilio_sid, config.twilio_secret);

var countries = require('country-data').countries;

var GFW = require('../gfw.js'),
    AirQuality = require('../air_quality.js');

module.exports = function(app) {

  var userCountry = function(iso2) {
    var country = countries[iso2];

    return {
      name: 'United States of America',
      iso3: 'USA'
    };
  };

  var DIGIT_MAP = {
    1: {name: "Air Quality", obj: AirQuality},
    2: {name: "Forest Loss", obj: GFW}
  };

  var handleCall = function(req, res) {
    var twiml = new twilio.TwimlResponse();

    twiml.say('Thank you for calling Resource Watch.')
    twiml.redirect('/menu', {method: 'GET'});

    res.type('text/xml');
    res.send(twiml.toString());
  };

  var menu = function(req, res) {
    var twiml = new twilio.TwimlResponse();

    var digits = req.query.Digits;
    if (digits !== undefined && digits.length > 0) {
      return handleMenu(req, res);
    }

    var country = userCountry(req.query.CallerCountry);

    twiml
      .gather({
        method: 'GET',
        numDigits: 1
      }, function() {
        _.each(DIGIT_MAP, function(source, digit) {
          this.say('Press ' + digit + ' for ' + country.name + ' ' + source.name + ' data');
          this.pause(1);
        }, this);
      });

    twiml.say("Sorry, I didn't catch that");
    twiml.redirect('/menu', {method: 'GET'});

    res.type('text/xml');
    res.send(twiml.toString());
  };

  var handleMenu = function(req, res) {
    var twiml = new twilio.TwimlResponse();

    var numberPressed = req.query.Digits;

    if (_.keys(DIGIT_MAP).indexOf(numberPressed) === -1) {
      twiml.say("Sorry, " + numberPressed + " is not a valid option.");
      twiml.redirect('/menu', {method: 'GET'});
    } else {
      var country = userCountry(req.query.CallerCountry[0]);
      var source  = DIGIT_MAP[numberPressed];
      var message = source.obj.get(country);

      twiml.say(message);
      twiml.pause(1);
      twiml.say('An SMS containing more details has been sent to your phone. Good bye.');

      sendDataMessage(req, numberPressed);
    }

    res.type('text/xml');
    res.send(twiml.toString());
  };

  var sendDataMessage = function(req, numberPressed) {
    var country = userCountry(req.query.CallerCountry[0]),
        source  = DIGIT_MAP[numberPressed];

    twilioClient.sendMessage({
      from: req.query.To,
      to: req.query.Caller,
      body: "Check out Resource Watch for more " + source.name + " data: http://bit.ly/1Fu93ky"
    }, function() { /* should handle errors here */ });
  };

  var handleMessage = function(req, res) {
    var twiml = new twilio.TwimlResponse();

    twiml.message([
      "Thanks for messaging Resource Watch. We're not ready yet to",
      "share our intelligent question processing, but there's",
      "plenty of data available. Call us instead on " + req.query.To
    ].join(" "));

    res.type('text/xml');
    res.send(twiml.toString());
  };

  var logRequest = function(req, res, next) {
    console.log(req.query);
    next();
  };

  return new express.Router()
    .use(logRequest)
    .get('/', handleCall)
    .get('/menu', menu)
    .get('/menu_handler', handleMenu)
    .get('/message_handler', handleMessage);

};
