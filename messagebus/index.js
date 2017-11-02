const AWS = require('aws-sdk');
const axios = require('axios');
const Consumer = require('sqs-consumer');

// const db = require('../database/index.js');
// const db = require('../database/index.js') //PRODUCTION DATABASE
const db = require('../database/test.js')  //TEST DATABASE
const url = require('./config/config.js');

// const queues = require('./queues') //uncomment when all are running
const ordersFromUsers = require('./queues/ordersFromUsers.js')
const fraudScoresFromAnalytics = require('./queues/fraudScoresFromAnalytics.js')
const qtyCheckFromInventory = require('./queues/qtyCheckFromInventory.js')

// AWS.config.loadFromPath(__dirname + '/config/config.json'); //for sending to my own queue
// AWS.config.loadFromPath(__dirname + '/config/useractivity/config.json'); //for sending to useractivity?
AWS.config.loadFromPath(__dirname + '/config/analytics/config.json'); //for sending to analytics?
AWS.config.setPromisesDependency(require('bluebird'));
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

/*=================================
EXAMPLE SEND MESSAGE TO ANALYTICS
=================================*/
// var createOrderObjToAnalytics = function(order_id) {
// 	let objToAnalytics = {}
//   return db.constructObjToAnalytics(order_id)
//     .then(result => {
//       var firstItem = result[0];
//       objToAnalytics.order = {
//         order_id: firstItem.order_id,
//         user_id: firstItem.user_id,
//         billing_state: firstItem.billing_state,
//         billing_ZIP: firstItem.billing_ZIP,
//         billing_country: firstItem.billing_country,
//         shipping_state: firstItem.shipping_state,
//         shipping_ZIP: firstItem.shipping_ZIP,
//         shipping_country: firstItem.shipping_country,
//         total_price: firstItem.total_price,
//         purchased_At: firstItem.purchased_At,
//         std_dev_from_aov: firstItem. std_dev_from_aov,
//       }
//       objToAnalytics.items = [];
//       result.forEach(function(item) {
//         var itemObj = {
//           item_id: item.item_id,
//           quantity: item.quantity,
//           seller_id: item.seller_id,
//         }
//         objToAnalytics.items.push(itemObj)
//       })
//       let qtyCheckParams = {
//         MessageBody: JSON.stringify(objToAnalytics),
//         QueueUrl: url.needsfraudscore
//       }
//       return sqs.sendMessage(qtyCheckParams).promise()
//     })
//     .then(data => {
//       console.log("Success", data.MessageId);
//     })
//     .catch(error => {
//       // res.sendStatus(500);
//       console.log("ERROR CREATING OBJ TO ANALYTICS: ", error)
//     })
// }

// createOrderObjToAnalytics(200) //UNCOMMENT TO SEND AN ORDER

/*=================================
EXAMPLE QTY CHECK INQUERY MESSAGE TO ANALYTICS
=================================*/
// var createQtyInquiryObjToInventory = function(order_id) {
//   let qtyCheckObj = {}
//   qtyCheckObj.order_id = order_id;
//   return db.constObjToInventory(order_id)
//     .then(result => {
//       qtyCheckObj.items = []
//       result.forEach(function(item) {
//         var itemObj = {
//           item_id: item.item_id,
//           seller_id: item.seller_id
//         }
//         qtyCheckObj.items.push(itemObj)
//       })
//       let qtyUpdateParams = {
//         MessageBody: JSON.stringify(qtyCheckObj),
//         QueueUrl: url.needsqtycheck
//       }
//       return sqs.sendMessage(qtyUpdateParams).promise()
//     })
//     .then(data => {
//       console.log("Success", data.MessageId);
//     })
//     .catch(error => {
//       // res.sendStatus(500);
//       console.log("Error sending qty check: ", error)
//     })
// }

// createQtyInquiryObjToInventory(254)

/*=================================
EXAMPLE QTY UPDATE INQUERY MESSAGE TO ANALYTICS
=================================*/
var createQtyUpdateObjToInventory = function(order_id) {
  let qtyUpdateObj = {};
  return db.constObjToInventory(order_id)
    .then(result => {
      qtyUpdateObj.items = []
      result.forEach(function(item) {
        var itemObj = {
          item_id: item.item_id,
          quantity: item.quantity,
          seller_id: item.seller_id
        }
        qtyUpdateObj.items.push(itemObj);
      })
      // res.send(qtyUpdateObj);
      let qtyUpdateParams = {
        MessageBody: JSON.stringify(objToAnalytics),
        QueueUrl: url.needsqtyupdate
      }
      return sqs.sendMessage(qtyUpdateParams).promise()
    })
    .then(data => {
      console.log("Success", data.MessageId);
    })
    .catch(error => {
      console.log("Error sending qty update: ", error)
    })
}



// module.exports = {
//   createOrderObjToAnalytics,
//   createQtyInquiryObjToInventory,
//   createQtyUpdateObjToInventory
// }

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