const AWS = require('aws-sdk');
const axios = require('axios');
const Consumer = require('sqs-consumer');

// const db = require('../database/index.js') //PRODUCTION DATABASE
const db = require('../database/test.js')  //TEST DATABASE
const url = require('./config/config.js');

// const queues = require('./queues') //uncomment when all are running
// const ordersFromUsers = require('./queues/ordersFromUsers.js')
// const fraudScoresFromAnalytics = require('./queues/fraudScoresFromAnalytics.js')
// const qtyCheckFromInventory = require('./queues/qtyCheckFromInventory.js')

// AWS.config.loadFromPath(__dirname + '/config/config.json'); //for sending to my own queue
// AWS.config.loadFromPath(__dirname + '/config/useractivity/config.json'); //for sending to useractivity?
AWS.config.loadFromPath(__dirname + '/config/analytics/config.json'); //for sending to analytics?
AWS.config.setPromisesDependency(require('bluebird'));
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

