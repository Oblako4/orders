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

const fraudscores = Consumer.create({
  queueUrl: url.fraudscores,
  handleMessage: (message, done) => {
    console.log('message: ', message)
    let fraudMessage = JSON.parse(message.Body)
    return db.addFraudScore(fraudMessage)
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

// const fraudscores = Consumer.create({
//   queueUrl: url.fraudscores,
//   handleMessage: (message, done) => {
//     console.log('message: ', message)
//     let fraudMessage = JSON.parse(message.Body)
    
//     let order_id = fraudMessage.order.order_id;
//     let fraud_score = fraudMessage.order.fraud_score;

//     return db.getDeclinedDate(order_id)
//       .then(result => {
//         if (result[0].declined_at === null) {
//           if (fraud_score >= fraud_limit) {
//             console.log("DECLINED ORDER, FRAUD SCORE TOO HIGH")
//             return declineOrder(order_id)
//           } else {
//             return db.getWholesaleTotal(order_id)
//               .then(result => {
//                 if (result[0].wholesale_total !== null) {
//                   console.log("CONFIRMED ORDER")
//                   return confirmOrder(order_id)
//                 } else {
//                   console.log("STILL WAITING FOR INVENTORY")
//                   return result;
//                 }
//               })
//           }
//         } else {
//           console.log("ORDER ALREADY DECLINED")
//           return result[0];
//         }
//       })
//       .then(result => {
//         return db.addFraudScore(fraudMessage)
//       })
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


fraudscores.on('error', (err) => {
	console.log(err.message);
	done(err); //can i keep this here?
})

fraudscores.start()