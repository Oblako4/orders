const AWS = require('aws-sdk');
const axios = require('axios');
const Consumer = require('sqs-consumer');

// const db = require('../database/index.js');
const db = require('../database/index.js') //TEST DATABASE
const url = require('./config/config.js');

const ordersFromUsers = require('./queues/ordersFromUsers.js')

// AWS.config.loadFromPath(__dirname + '/config/config.json'); //for sending to my own queue
// AWS.config.loadFromPath(__dirname + '/config/useractivity/config.json'); //for interacting w/ USER ACTIVITY
// AWS.config.setPromisesDependency(require('bluebird'));
// var sqs = new AWS.SQS({apiVersion: '2012-11-05'});


// const app = Consumer.create({
//   queueUrl: url.qtycheck,
//   handleMessage: (message, done) => {
//   	console.log('message: ', message)
//   	//validate data
//   	//if correct, add to database
//     done();
//   },
//   sqs: sqs
// })

// app.on('error', (err) => {
// 	console.log(err.message);
// 	done(err); //can i keep this here?
// })

// app.start()
/*==========================================
RECEIVE ORDERS VIA SQS
==========================================*/
// const userorders = Consumer.create({
//   queueUrl: url.userorders,
//   handleMessage: (message, done) => {
//   	console.log('message: ', message)
//   	return axios.post('http://127.0.0.1:3000/order', JSON.parse(message.Body))
//   	.then(result => {
//   		console.log("SUCCESS")
//   		done();
//   	})
//   	.catch(err => {
//   		console.log("ERROR: ", err);
//   	})
//     // done();
//   },
//   sqs: sqs
// })

// userorders.on('error', (err) => {
// 	console.log(err.message);
// 	// done(err); //can i keep this here?
// })

// userorders.start()

/*=================================
EXAMPLE SEND MESSAGE TO ANALYTICS
=================================*/
// var orderObj = {order_id: 12341234, items: [{item_id: 123456789012, seller_id: 120}, {item_id: 123456789011, seller_id: 134}]}
var createOrderObjToAnalytics = function() {
	let objToAnalytics = {}
  return db.constructObjToAnalytics(3)
    .then(result => {

      var firstItem = result[0];
      objToAnalytics.order = {
        order_id: firstItem.order_id,
        user_id: firstItem.user_id,
        billing_state: firstItem.billing_state,
        billing_ZIP: firstItem.billing_ZIP,
        billing_country: firstItem.billing_country,
        shipping_state: firstItem.shipping_state,
        shipping_ZIP: firstItem.shipping_ZIP,
        shipping_country: firstItem.shipping_country,
        total_price: firstItem.total_price,
        purchased_At: firstItem.purchased_At,
        std_dev_from_aov: firstItem. std_dev_from_aov,
      }
      objToAnalytics.items = [];
      result.forEach(function(item) {
        var itemObj = {
          item_id: item.item_id,
          quantity: item.quantity,
          seller_id: item.seller_id,
        }
        objToAnalytics.items.push(itemObj)
      })
      let qtyCheckParams = {
        MessageBody: JSON.stringify(objToAnalytics),
        QueueUrl: url.fraud
      }
      sqs.sendMessage(qtyCheckParams).promise()
        .then(data => {
          console.log("Success", data.MessageId);
        })
        .catch(error => {
          console.log("Error: ", error)
        })
    })
    .catch(error => {
      // res.sendStatus(500);
      console.log("ERROR CREATING OBJ TO ANALYTICS: ", error)
    })
}

// createOrderObjToAnalytics() //UNCOMMENT TO SEND AN ORDER

/*=================================
EXAMPLE QUANTITY CHECK TO INVENTORY
=================================*/
// var qtyCheckBody = {order_id: 12341234, items: [{item_id: 123456789012, seller_id: 120}, {item_id: 123456789011, seller_id: 134}]}


// var qtyCheckParams = {
// 	MessageBody: JSON.stringify(qtyCheckBody),
// 	QueueUrl: url.qtycheck
// }

// sqs.sendMessage(qtyCheckParams).promise()
//   .then(data => {
//     console.log("Success", data.MessageId);
//   })
//   .catch(error => {
//     console.log("Error: ", error)
//   })
/*=================================
EXAMPLE SEND MESSAGE
=================================*/
// var params = {
//  DelaySeconds: 10,
//  MessageAttributes: {
//   "Title": {
//     DataType: "String",
//     StringValue: "The Whistler"
//    },
//   "Author": {
//     DataType: "String",
//     StringValue: "John Grisham"
//    },
//   "WeeksOn": {
//     DataType: "Number",
//     StringValue: "6"
//    }
//  },
//  MessageBody: "Information about current NY Times fiction bestseller for week of 12/11/2016.",
//  QueueUrl: "https://sqs.us-east-1.amazonaws.com/097848212244/orders"
// };


// sqs.sendMessage(params).promise()
//   .then(data => {
//     console.log("Success", data.MessageId);
//   })
//   .catch(error => {
//     console.log("Error: ", error)
//   })

/*=================================
EXAMPLE RECEIVE AND DELETE MESSAGE
=================================*/

// var params = {
//   QueueUrl: "https://sqs.us-east-1.amazonaws.com/097848212244/orders",
//   // AttributeNames: ["All"],
//   MaxNumberOfMessages: 1,
//   // MessageAttributeNames: ["Title", "Author", "WeeksOn"],
//   // VisibilityTimeout: 0,
//   // WaitTimeSeconds: 0
// }

// sqs.receiveMessage(params).promise()
//   .then(data => {
//     var messages = Array.prototype.slice.call(data.Messages)
//     receiptHandle = messages[0].ReceiptHandle;
//     body = messages[0].Body;
//     console.log(body)
//     return receiptHandle;
//   })
//   .then(receiptHandle => {
//     var deleteParams = {
//       QueueUrl: "https://sqs.us-east-1.amazonaws.com/097848212244/orders",
//       ReceiptHandle: receiptHandle
//     }
//     return sqs.deleteMessage(deleteParams).promise()
//     console.log(receiptHandle)
//   })
//   .then(result => {
//     console.log("Result of delete: ", result);
//   })
//   .catch(error => {
//     console.log("Error: ", error)
//   })