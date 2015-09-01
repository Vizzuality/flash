var mongoose = require('mongoose');
var cache = require('mongoose-cache');
var timestamps = require('mongoose-timestamp');
var crypto = require('crypto');
var logger = require('logfmt');
var Promise = require('promise');
var _ = require('lodash');
var uuid = require('node-uuid');

var config = require('../config');
var twilio = require('twilio')(config.twilio_sid, config.twilio_secret);

var errors = require('./errors');

var STATES = ['pending', 'complete', 'failed'];
var FIVE_MINUTES = 1000 * 60 * 5;

module.exports = function(connection, maxAge) {

  // Monkey-patch Mongoose to support in-memory caching for 10s
  cache.install(mongoose, {
    max: 50,
    maxAge: maxAge
  });

  var Schema = mongoose.Schema({
    _id: { type: String },
    text: { type: String },
    country: { type: String },
    reply_to: { type: String }
  }, {
    strict: true
  });

  Schema.plugin(timestamps);

  Schema.set('toJSON', {
    getters: true
  });

  Schema.statics = {

    process: function(request) {
      return new Promise(function(resolve, reject) {
        var Request = this,
            id = uuid.v1();

        new Request({
          _id: id,
          text: request.Body,
          country: request.FromCountry,
          reply_to: request.From
        }).save(onSave);

        function onSave(err, request) {
          if (err) {
            logger.log({ type: 'error', msg: 'could not save', error: err });
            return reject(err);
          }
          logger.log({ type: 'info', msg: 'saved request', id: request.id });

          var requestJSON = request.toObject();
          twilio.makeCall({
            to: requestJSON.reply_to,
            from: '+441291606025',
            url: 'http://twil.cyanoryx.com'
          }, function(err, responseData) {
            if (err) {
              logger.log({ type: 'error', msg: 'could not make call', error: JSON.stringify(err) });
              return reject(err);
            }

            logger.log({ type: 'info', msg: 'started call', id: request.id });
            return resolve(request);
          });
        }
      }.bind(this));
    },

    get: function(id) {
      return new Promise(function(resolve, reject) {
        this.findById(id).exec(function(err, request) {
          if (err) return reject(err);
          if (!request) return reject(new errors.ArticleNotFound());
          resolve(request);
        });
      }.bind(this));
    },

    deleteAll: function() {
      return new Promise(function(resolve, reject) {
        this.remove().exec(function(err) {
          if (err) return reject(err);
          resolve();
        });
      }.bind(this));
    }
  };

  var Request = connection.model('Request', Schema);
  return Request;
};
