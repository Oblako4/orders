const AWS = require('aws-sdk');
const axios = require('axios');
const Consumer = require('sqs-consumer');

// const db = require('../../database/index.js') //PRODUCTION DATABASE
const db = require('../../database/test.js')  //TEST DATABASE
const url = require('../config/config.js');
const inv = require('./qtyCheckToInventory.js');
const analytics = require('./fraudScoreCheckToAnalytics');

AWS.config.loadFromPath(__dirname + '/../config/useractivity/config.json');
AWS.config.setPromisesDependency(require('bluebird'));
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

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

// var createOrderObjToAnalytics = function(order_id) {
//   let objToAnalytics = {}
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

const userorders = Consumer.create({
  queueUrl: url.userorders,
  handleMessage: (message, done) => {
    let order_id = JSON.parse(message.Body).order.id;
    console.log('message: ', message)
    return axios.post('http://127.0.0.1:3000/order', JSON.parse(message.Body))
    .then(result => {
      console.log("SUCCESSFULLY RECEIVED MESSAGE FROM USERS")
      // done();
      return analytics.createOrderObjToAnalytics(order_id)
    })
    .then(result => {
      console.log("SUCCESSFULLY SENT MESSAGE TO ANALYTICS")
      return inv.qtyCheckToInventory(order_id)
    })
    .then(result => {
      console.log("SUCCESSFULLY SENT MESSAGE TO INVENTORY")
      done();
    })
    .catch(err => {
      console.log("ERROR: ", err);
    })
    // done();
  },
  sqs: sqs
})


userorders.on('error', (err) => {
	console.log(err.message);
	// done(err); //can i keep this here?
})

userorders.start()