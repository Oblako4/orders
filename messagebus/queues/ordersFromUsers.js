const AWS = require('aws-sdk');
const axios = require('axios');
const Consumer = require('sqs-consumer');

// const db = require('../../database/index.js') //PRODUCTION DATABASE
const db = require('../../database/test.js')  //TEST DATABASE
const url = require('../config/config.js');
const inv = require('./qtyCheckToInventory.js');
const analytics = require('./fraudScoreCheckToAnalytics');

AWS.config.loadFromPath(__dirname + '/../config/config.json');
AWS.config.setPromisesDependency(require('bluebird'));
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const userorders = Consumer.create({
  queueUrl: url.userorders,
  handleMessage: (message, done) => {
    // console.log('message: ', message.Body)
    let orderMessage = JSON.parse(message.Body)
    let order_id = orderMessage.order.id;
    let total_price = orderMessage.order.total_price;
    var avg;
    var std_dev;

    var year = orderMessage.order.purchased_at.slice(0, 4);
    var month = orderMessage.order.purchased_at.slice(5, 7);
    return db.getAOVandStdDev(year, month)
      .then(AOVresult => {
        // console.log('aov result', AOVresult)
        avg = AOVresult[0].avg;
        std_dev = AOVresult[0].std_dev;
        return db.addNewOrderPlusStdDev(orderMessage, avg, std_dev);
      })
      .then((result) => {
        return db.addPurchaseDate(orderMessage.order)
      })
      .then(result => {
        return Promise.all(
          orderMessage.order.items.map(function (itemObj) { //THIS HAS BEEN CHANGED MAY AFFECT OTHER AREAS
            return db.addItem(itemObj); //ADDED RETURN HERE
          })
        )
      })
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
        // done();
      })
    // done();
  },
  sqs: sqs
})

// const userorders = Consumer.create({
//   queueUrl: url.userorders,
//   handleMessage: (message, done) => {
//     // console.log('message: ', message.Body)
//     let order_id = JSON.parse(message.Body).order.id;
//     // console.log('message: ', message.Body)
//     return axios.post('http://127.0.0.1:3000/order', JSON.parse(message.Body))
//     .then(result => {
//       console.log("SUCCESSFULLY RECEIVED MESSAGE FROM USERS")
//       // done();
//       return analytics.createOrderObjToAnalytics(order_id)
//     })
//     .then(result => {
//       console.log("SUCCESSFULLY SENT MESSAGE TO ANALYTICS")
//       return inv.qtyCheckToInventory(order_id)
//     })
//     .then(result => {
//       console.log("SUCCESSFULLY SENT MESSAGE TO INVENTORY")
//       done();
//     })
//     .catch(err => {
//       console.log("ERROR: ", err);
//       // done();
//     })
//     // done();
//   },
//   sqs: sqs
// })


userorders.on('error', (err) => {
	console.log(err.message);
	done(err); //can i keep this here?
})

userorders.start()