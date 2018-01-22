const AWS = require('aws-sdk');
const axios = require('axios');
const Consumer = require('sqs-consumer');
const moment = require('moment');

// const db = require('../../database/index.js') //PRODUCTION DATABASE
const db = require('../../database/test.js')  //TEST DATABASE
const url = require('../config/config.js');

AWS.config.loadFromPath(__dirname + '/../config/config.json');
AWS.config.setPromisesDependency(require('bluebird'));
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const fraud_limit = 75;

const isInvQtySufficient = (purchasedItems, invItems) => {
  let isQtySufficient = true;
  purchasedItems.forEach(function(purchasedItem, index) {
    if (purchasedItem.quantity > invItems[index].quantity) {
      isQtySufficient = false
    }
  })
  return isQtySufficient;
}

const declineOrder = (order_id) => {
  let now = moment().format("YYYY-MM-DD HH:mm:ss");
  return db.updateOrderHistory("declined_at", now, order_id)
}

const confirmOrder = (order_id) => {
  let now = moment().format("YYYY-MM-DD HH:mm:ss");
  return db.updateOrderHistory("confirmed_at", now, order_id)
}

const isFraudScoreAvail = (order_id) => {
  return db.getFraudScore(order_id)
  .then(result => {
    if (result[0].fraud_score === null) {
      // console.log(result[0].fraud_score)
      return null;
    } else {
      return result[0].fraud_score
    }
  })
  .catch(err => {
    console.log('ERROR: ', err);
  })
}

var params = {
  QueueUrl: url.qtycheck,
  // MaxNumberOfMessages: 1,
  // VisibilityTimeout: 1, //may need to adjust this
  // WaitTimeSeconds: 1 //may need to adjust this
};

const pollQueue = () => {
  sqs.receiveMessage(params).promise()
  .then(data => {
    // console.log(data.Messages[0].Body)
    if (data.Messages) {
      var parsedItems = JSON.parse(data.Messages[0].Body);
      // console.log(parsedItems[0].quantity)

      let wholesale_total = 0; //changed from var to let
      let order_id = parsedItems[0].order_id; //changed from var to let
      return db.getItems(order_id)
        .then(purchasedItems => {
          if (isInvQtySufficient(purchasedItems, parsedItems)) {
            return Promise.all(
              parsedItems.map(function(itemObj, index) {
                order_id = itemObj.order_id;
                wholesale_total += itemObj.wholesale_price * purchasedItems[index].quantity; //THIS HAS BEEN UPDATED
                return db.addInventoryDataToItem(itemObj)
              })
            )
          }
        })
        .then(result => {
          console.log("SUCCESSFULLY RECEIVED QTY CHECK FROM INVENTORY")
          return db.addWholesaleTotal(order_id, wholesale_total)
          // done();
        })
        .then(result => {
          // console.log('Receipt handle: ', data.Messages[0].ReceiptHandle);
          var deleteParams = {
            QueueUrl: url.qtycheck,
            ReceiptHandle: data.Messages[0].ReceiptHandle
          }
          return sqs.deleteMessage(deleteParams).promise()
          // console.log(data.Messages[0].ReceiptHandle);
        })
        .then(result => {
          console.log('message erased', result);
        })
        .catch(err => {
          console.log("ERROR: ", err);
        })
      } else {
        // console.log('NO MESSAGES FROM INVENTORY')
      }
  })
  .catch(err => {
    console.log(err, err.stack);
  })
}

setInterval(pollQueue, 50);
// sqs.receiveMessage(params, function(err, data) {
//   if (err) {
//     console.log(err, err.stack);
//   } else {
//     // console.log(data.Messages[0].Body)
//     var parsedItems = JSON.parse(data.Messages[0].Body);
//     // console.log(parsedItems[0].quantity)

//     let wholesale_total = 0; //changed from var to let
//     let order_id = parsedItems[0].order_id; //changed from var to let
//     return db.getItems(order_id)
//       .then(purchasedItems => {
//         if (isInvQtySufficient(purchasedItems, parsedItems)) {
//           return Promise.all(
//             parsedItems.map(function(itemObj, index) {
//               order_id = itemObj.order_id;
//               wholesale_total += itemObj.wholesale_price * purchasedItems[index].quantity; //THIS HAS BEEN UPDATED
//               return db.addInventoryDataToItem(itemObj)
//             })
//           )
//         }
//       })
//       .then(result => {
//         console.log("SUCCESSFULLY RECEIVED QTY CHECK FROM INVENTORY")
//         return db.addWholesaleTotal(order_id, wholesale_total)
//         // done();
//       })
//       .then(result => {
//         console.log('Receipt handle: ', data.Messages[0].ReceiptHandle);
//         var deleteParams = {
//           QueueUrl: url.qtycheck,
//           ReceiptHandle: data.Messages[0].ReceiptHandle
//         }
//         return sqs.deleteMessage(deleteParams).promise()
//         // console.log(data.Messages[0].ReceiptHandle);
//       })
//       .then(result => {
//         console.log('message erased');
//       })
//       .catch(err => {
//         console.log("ERROR: ", err);
//       })
      

//   }
// });

// const qtycheck = Consumer.create({
//   queueUrl: url.qtycheck,
//   handleMessage: (message, done) => {
//     console.log('message:', message.Body)
//     var items = JSON.parse(message.Body);
//     let wholesale_total = 0; //changed from var to let
//     let order_id = items[0].order_id; //changed from var to let
//     return db.getItems(order_id)
//     .then(purchasedItems => {
//       if (isInvQtySufficient(purchasedItems, items)) {
//         return Promise.all(
//           items.map(function(itemObj, index) {
//             order_id = itemObj.order_id;
//             wholesale_total += itemObj.wholesale_price * purchasedItems[index].quantity; //THIS HAS BEEN UPDATED
//             return db.addInventoryDataToItem(itemObj)
//           })
//         )
//       }
//     })
//     .then(result => {
//       console.log("SUCCESSFULLY RECEIVED QTY CHECK FROM INVENTORY")
//       return db.addWholesaleTotal(order_id, wholesale_total)
//       // done();
//     })
//     .then(result => {
//       done();
//     })
//     .catch(err => {
//       console.log("ERROR: ", err);
//     })
//     // done();
//   },
//   sqs: sqs
// })


// qtycheck.on('error', (err, done) => {
// 	console.log(err.message);
// 	done(err); //can i keep this here?
// })

// qtycheck.start()