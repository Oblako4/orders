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

const userorders = Consumer.create({
  queueUrl: url.userorders,
  handleMessage: (message, done) => {
    let order_id = JSON.parse(message.Body).order.id;
    console.log('message: ', message.Body)
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