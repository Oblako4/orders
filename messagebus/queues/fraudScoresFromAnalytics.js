const AWS = require('aws-sdk');
const axios = require('axios');
const Consumer = require('sqs-consumer');

// const db = require('../../database/index.js') //PRODUCTION DATABASE
const db = require('../../database/test.js')  //TEST DATABASE
const url = require('../config/config.js');
const inv = require('./qtyCheckToInventory.js');

AWS.config.loadFromPath(__dirname + '/../config/analytics/config.json');
AWS.config.setPromisesDependency(require('bluebird'));
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const fraud_limit = 75;

const declineOrder = (order_id) => {
  var now = moment().format("YYYY-MM-DD HH:mm:ss");
  return db.updateOrderHistory("declined_at", now, order_id)
}

const confirmOrder = (order_id) => {
  var now = moment().format("YYYY-MM-DD HH:mm:ss");
  return db.updateOrderHistory("confirmed_at", now, order_id)
}

const fraudscores = Consumer.create({
  queueUrl: url.fraudscores,
  handleMessage: (message, done) => {
    let order_id = JSON.parse(message.Body).order.id;
    console.log('message: ', message)
    return db.addFraudScore(JSON.parse(message.Body))
      .then(result => {

        console.log("SUCCESSFULLY RECEIVED MESSAGE FROM ANALYTICS")
        done();
      })
      .catch(err => {
        console.log("ERROR: ", err);
      })
    // done();
  },
  sqs: sqs
})


fraudscores.on('error', (err) => {
	console.log(err.message);
	// done(err); //can i keep this here?
})

fraudscores.start()