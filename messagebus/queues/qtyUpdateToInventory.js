const AWS = require('aws-sdk');
const axios = require('axios');
const Consumer = require('sqs-consumer');

// const db = require('../../database/index.js') //PRODUCTION DATABASE
const db = require('../../database/test.js')  //TEST DATABASE
const url = require('../config/config.js');

AWS.config.loadFromPath(__dirname + '/../config/useractivity/config.json');
AWS.config.setPromisesDependency(require('bluebird'));
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

var qtyUpdateToInventory = function(order_id) {
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
        QueueUrl: url.qtyupdate
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

module.exports = {
  qtyUpdateToInventory,
}