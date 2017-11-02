const AWS = require('aws-sdk');
const axios = require('axios');
const Consumer = require('sqs-consumer');

// const db = require('../../database/index.js') //PRODUCTION DATABASE
const db = require('../../database/test.js')  //TEST DATABASE
const url = require('../config/config.js');

AWS.config.loadFromPath(__dirname + '/../config/useractivity/config.json');
AWS.config.setPromisesDependency(require('bluebird'));
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const qtycheck = Consumer.create({
  queueUrl: url.qtycheck,
  handleMessage: (message, done) => {
  	console.log('message: ', message.Body)
    var order_id;
    var wholesale_total = 0;
    var items = JSON.parse(message.Body)
    return Promise.all(
      items.map(function(itemObj) {
        order_id = itemObj.order_id;
        wholesale_total += itemObj.wholesale_price;
        return db.addInventoryDataToItem(itemObj)
      })
    )
    .then(result => {
      return db.addWholesaleTotal(order_id, wholesale_total)
    })
    .then(result => {
      console.log("SUCCESSFULLY RECEIVED QTY CHECK FROM INVENTORY")
      done();
    })
    .catch(err => {
      console.log("ERROR: ", err);
    })
    // done();
  },
  sqs: sqs
})

qtycheck.on('error', (err) => {
	console.log(err.message);
	// done(err); //can i keep this here?
})

qtycheck.start()