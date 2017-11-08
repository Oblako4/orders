const AWS = require('aws-sdk');
const axios = require('axios');
const Consumer = require('sqs-consumer');

// const db = require('../../database/index.js') //PRODUCTION DATABASE
const db = require('../../database/test.js')  //TEST DATABASE
const url = require('../config/config.js');
const inv = require('./qtyCheckToInventory.js');

AWS.config.loadFromPath(__dirname + '/../config/config.json');
AWS.config.setPromisesDependency(require('bluebird'));
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

var createOrderObjToAnalytics = function(order_id) {
  let objToAnalytics = {}
  return db.constructObjToAnalytics(order_id)
    .then(result => {
      // console.log("result from db", result)
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
        QueueUrl: url.needsfraudscore
      }
      return sqs.sendMessage(qtyCheckParams).promise()
    })
    .then(data => {
      console.log("SUCCESS SENDING OBJ TO ANALYTICS", data.MessageId);
    })
    .catch(error => {
      // res.sendStatus(500);
      console.log("ERROR CREATING OBJ TO ANALYTICS: ", error)
    })
}

module.exports = {
  createOrderObjToAnalytics,
}