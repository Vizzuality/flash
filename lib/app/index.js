var logger = require('logfmt');
var Promise = require('promise');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');

var connections = require('./connections');
var RequestModel = require('./article-model');

var QUEUE = 'jobs.messages';

function App(config) {
  EventEmitter.call(this);

  this.config = config;
  this.connections = connections(config.mongo_url, config.rabbit_url);
  this.connections.once('ready', this.onConnected.bind(this));
  this.connections.once('lost', this.onLost.bind(this));
}

module.exports = function createApp(config) {
  return new App(config);
};

App.prototype = Object.create(EventEmitter.prototype);

App.prototype.onConnected = function() {
  var queues = 0;
  this.Request = RequestModel(this.connections.db, this.config.mongo_cache);
  this.connections.queue.create(QUEUE, { prefetch: 5 }, onCreate.bind(this));

  function onCreate() {
    if (++queues === 1) this.onReady();
  }
};

App.prototype.onReady = function() {
  logger.log({ type: 'info', msg: 'app.ready' });
  this.emit('ready');
};

App.prototype.onLost = function() {
  logger.log({ type: 'info', msg: 'app.lost' });
  this.emit('lost');
};

App.prototype.addRequest = function(request) {
  this.connections.queue.publish(QUEUE, request);
  return Promise.resolve();
};

App.prototype.start = function() {
  this.connections.queue.handle(QUEUE, this.handleJob.bind(this));
  return this;
};

App.prototype.stop = function() {
  this.connections.queue.ignore(QUEUE);
  return this;
};

App.prototype.handleJob = function(job, ack) {
  logger.log({ type: 'info', msg: 'handling job', queue: QUEUE });

  this.Request.process(job).then(onSuccess, onError);

  function onSuccess() {
    logger.log({ type: 'info', msg: 'job complete', status: 'success' });
    ack();
  }

  function onError() {
    logger.log({ type: 'info', msg: 'job complete', status: 'failure' });
    ack();
  }
};
