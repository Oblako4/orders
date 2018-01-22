const AWS = require('aws-sdk');
const axios = require('axios');
const Consumer = require('sqs-consumer');
const moment = require("moment");

// const db = require('../../database/index.js') //PRODUCTION DATABASE
const db = require('../../database/test.js')  //TEST DATABASE
const url = require('../config/config.js');
const inv = require('./qtyCheckToInventory.js');

// AWS.config.loadFromPath(__dirname + '/../config/analytics/config.json');
AWS.config.loadFromPath(__dirname + '/../config/config.json');
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

var params = {
  QueueUrl: url.fraudscores,
};

const pollQueue = () => {
  let ReceiptHandle;
  return sqs.receiveMessage(params).promise()
  .then(data => {
    if (data.Messages) {
      console.log(data)
      ReceiptHandle = data.Messages[0].ReceiptHandle;
      var parsedScore = JSON.parse(data.Messages[0].Body);
      console.log(parsedScore)
      return db.addFraudScore(parsedScore)
    } else {
      return false;
    }
  })
  .then(data => {
    if (data) {
      console.log("SUCCESSFULLY RECEIVED MESSAGE FROM ANALYTICS")
      var deleteParams = {
        QueueUrl: url.fraudscores,
        ReceiptHandle: ReceiptHandle
      }
      return sqs.deleteMessage(deleteParams).promise()
    } else {
      return false;
    }
  })
  .then(result => {
    if (result) {
      console.log('analytics message erased', result);
    }
  })
  .catch(err => {
    console.log(err, err.stack);
  })
}

setInterval(pollQueue, 50);
// const fraudscores = Consumer.create({
//   queueUrl: url.fraudscores,
//   handleMessage: (message, done) => {
//     console.log('message: ', message)
//     let fraudMessage = JSON.parse(message.Body)
//     return db.addFraudScore(fraudMessage)
//       .then(result => {
//         console.log("SUCCESSFULLY RECEIVED MESSAGE FROM ANALYTICS")
//         done();
//       })
//       .catch(err => {
//         console.log("ERROR: ", err);
//       })
//     // done();
//   },
//   sqs: sqs
// })


// fraudscores.on('error', (err) => {
// 	console.log(err.message);
// 	done(err); //can i keep this here?
// })

// fraudscores.start()