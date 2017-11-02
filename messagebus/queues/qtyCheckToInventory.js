const AWS = require('aws-sdk');
const axios = require('axios');
const Consumer = require('sqs-consumer');

// const db = require('../../database/index.js') //PRODUCTION DATABASE
const db = require('../../database/test.js')  //TEST DATABASE
const url = require('../config/config.js');

// AWS.config.loadFromPath(__dirname + '/../config/inventory/config.json');
AWS.config.loadFromPath(__dirname + '/../config/config.json');
AWS.config.setPromisesDependency(require('bluebird'));
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

var qtyCheckToInventory = function(order_id) {
  let qtyCheckObj = {}
  qtyCheckObj.order_id = order_id;
  return db.constObjToInventory(order_id)
    .then(result => {
      qtyCheckObj.items = []
      result.forEach(function(item) {
        var itemObj = {
          item_id: item.item_id,
          seller_id: item.seller_id
        }
        qtyCheckObj.items.push(itemObj)
      })
      let qtyUpdateParams = {
        MessageBody: JSON.stringify(qtyCheckObj),
        QueueUrl: url.needsqtycheck
      }
      return sqs.sendMessage(qtyUpdateParams).promise()
    })
    .then(data => {
      console.log("Success", data.MessageId);
    })
    .catch(error => {
      // res.sendStatus(500);
      console.log("Error sending qty check: ", error)
    })
}

module.exports = {
  qtyCheckToInventory,
}