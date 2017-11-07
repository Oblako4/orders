const AWS = require('aws-sdk');
const cron = require('node-cron');
const moment = require("moment");
const Consumer = require('sqs-consumer');

const db = require('../database/test.js')
const url = require('../messagebus/config/config.js')

AWS.config.loadFromPath(__dirname + '/../messagebus/config/config.json');
AWS.config.setPromisesDependency(require('bluebird'));
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const fraud_limit = 75;
//check if wholesale_total = 0
  //if yes, decline order
  //if no, check if fraud score > fraud limit
    //if yes, decline
    //if no, confirm

const declineOrder = (order_id) => {
  let now = moment().format("YYYY-MM-DD HH:mm:ss");
  return db.updateOrderHistory("declined_at", now, order_id)
}

const confirmOrder = (order_id) => {
  let now = moment().format("YYYY-MM-DD HH:mm:ss");
  return db.updateOrderHistory("confirmed_at", now, order_id)
}


const getOrdersNeedingProcessed = () => {
	return db.getOrdersToBeProcessed()
    .then(results => {
      console.log("results: ", results);
      return Promise.all(
        results.map(function(result) {
          let orders = {
            MessageBody: JSON.stringify({order_id: result.order_id}),
            QueueUrl: url.process
          }
          return sqs.sendMessage(orders).promise()     
        })
      )
    })
    .then(result => {
      console.log("Result: ", result);
    })
    .catch(err => {
      console.log("ERROR: ", err);
    })
}

const addOrderBackIntoQueue = (order_id) => {
  let order = {
    MessageBody: JSON.stringify({order_id: order_id}),
    QueueUrl: url.process
  }
  return sqs.sendMessage(order).promise()
    .then(result => {
      console.log("Result: ", result);
    })
    .catch(err => {
      console.log("ERROR: ", err);
    })
}

const confirmOrDecline = Consumer.create({
  queueUrl: url.process,
  handleMessage: (message, done) => {
    let order_id = JSON.parse(message.Body).order_id;
    return db.getWholesaleAndFraud(order_id)
      .then(result => {
        console.log("order_id: ", order_id);
        if (result[0].wholesale_total !== null && result[0].fraud_score !== null) {
          if (result[0].wholesale_total !== 0 && result[0].fraud_score < fraud_limit) {
            console.log("CONFIRMING ORDER ID ${order_id}")
            return confirmOrder(order_id)
          } else {
            console.log(`DECLINING ORDER ID ${order_id}`)
            return declineOrder(order_id)
          }
        } else {
          console.log(`ORDER ${order_id} NOT READY TO BE PROCESSED`)
          return addOrderBackIntoQueue(order_id);
        }
      })
      .then(result => {
        console.log("Result: ", result);
        done();
      })
      .catch(err => {
        console.log("ERROR: ", err);
      })
    // done();
  },
  sqs: sqs
})


confirmOrDecline.on('error', (err) => {
  console.log(err.message);
  done(err); //can i keep this here?
})

// confirmOrDecline.start()

// getOrdersNeedingProcessed();

// var task = cron.schedule('* * * * *', function() {
//   // console.log(`ran task ${j++}`);
//   console.log('GATHERING ORDERS TO BE PROCESSED')
//   getOrdersNeedingProcessed();
// }, true);
// task.start();

