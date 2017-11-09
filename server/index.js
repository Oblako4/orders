const bodyParser = require('body-parser');
const elasticsearch = require('elasticsearch');
const express = require('express');
const Promise = require('bluebird');
const AWS = require('aws-sdk');
const Consumer = require('sqs-consumer');

// const db = require('../database/index.js') //PRODUCTION DATABASE
const db = require('../database/test.js') //TEST DATABASE
const mb = require('../messagebus/index.js')
const inv = require('../messagebus/queues/qtyCheckToInventory.js');
const analytics = require('../messagebus/queues/fraudScoreCheckToAnalytics');

const app = express()
const PORT = process.env.PORT || 3000;

//Elastic Search==========================
// var client = new elasticsearch.Client({
// 	host: 'localhost:9200',
// 	log: 'trace'
// });


//Routes==================================
app.listen(PORT, () => {
	console.log(`listening on port ${PORT}`);
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


/*================================================================
ORDERS ENDPOINT USED FOR TESTING (NO MESSAGE BUS)
================================================================*/
// app.post('/order', (req, res) => {
//   var order_id = req.body.order.id;
//   var total_price = req.body.order.total_price;
//   var avg;
//   var std_dev;
//   return db.addNewOrder(req.body)
//     .then(result => {
//       return Promise.all(
//         req.body.order.items.map(function (itemObj) { //THIS HAS BEEN CHANGED MAY AFFECT OTHER AREAS
//           return db.addItem(itemObj); //ADDED RETURN HERE
//         })
//       )
//       .then((result) => {
//         return db.addPurchaseDate(req.body.order)
//       })
//       .then(result => {
//         var year = req.body.order.purchased_at.slice(0, 4);
//         var month = req.body.order.purchased_at.slice(5, 7);
//         return db.getAOVandStdDev(year, month)
//       })
//       .then(AOVresult => {
//         // console.log('aov result', AOVresult)
//         avg = AOVresult[0].avg;
//         std_dev = AOVresult[0].std_dev;
//         return db.addStandardDev(order_id, total_price, avg, std_dev);
//       })
//       .then(result => {
//         res.sendStatus(200);
//       })
//       .catch((error) => {
//         console.log("ERROR in POST /order! ", error);
//         res.sendStatus(500);
//       })
//     })
//     .catch(error => {
//       console.log('ERROR in POST /order!: ', error);
//       res.sendStatus(500);
//     })
//     // .error(err => {
//     //  console.log(err);
//     // })
// })

/*================================================================
ORDERS ENDPOINT USED FOR HTTP REQUESTS FROM USERS (/W MESSAGE BUS)
================================================================*/
// app.post('/order', (req, res) => {
// 	var order_id = req.body.order.id;
// 	var total_price = req.body.order.total_price;
// 	var avg;
// 	var std_dev;
// 	return db.addNewOrder(req.body)
// 		.then(result => {
// 			return Promise.all(
// 				req.body.order.items.map(function (itemObj) { //THIS HAS BEEN CHANGED MAY AFFECT OTHER AREAS
// 					return db.addItem(itemObj); //ADDED RETURN HERE
// 				})
// 			)
// 			.then((result) => {
// 				return db.addPurchaseDate(req.body.order)
// 			})

// 			.then(result => {
// 				var year = req.body.order.purchased_at.slice(0, 4);
// 				var month = req.body.order.purchased_at.slice(5, 7);
// 				return db.getAOVandStdDev(year, month)
// 			})
// 			.then(AOVresult => {
// 				// console.log('aov result', AOVresult)
// 				avg = AOVresult[0].avg;
// 				std_dev = AOVresult[0].std_dev;
// 				return db.addStandardDev(order_id, total_price, avg, std_dev);
// 			})
//       .then(result => {
//         res.sendStatus(200);
//       })
// 			.then(result => {
//         console.log("SUCCESSFULLY RECEIVED MESSAGE FROM USERS")
//         // done();
//         return analytics.createOrderObjToAnalytics(order_id)
//       })
//       .then(result => {
//         console.log("SUCCESSFULLY SENT MESSAGE TO ANALYTICS")
//         return inv.qtyCheckToInventory(order_id)
//       })
//       .then(result => {
//         console.log("SUCCESSFULLY SENT MESSAGE TO INVENTORY")
//       })
// 			.catch((error) => {
// 				console.log("ERROR in POST /order! ", error);
// 				res.sendStatus(500);
// 			})
// 		})
// 		.catch(error => {
// 			console.log('ERROR in POST /order!: ', error);
// 			res.sendStatus(500);
// 		})
// })

/*================================================================
OPTIMIZED ORDERS ENDPOINT USED FOR HTTP REQUESTS FROM USERS (/W MESSAGE BUS)
================================================================*/
app.post('/order', (req, res) => {
  var order_id = req.body.order.id;
  var total_price = req.body.order.total_price;
  var avg;
  var std_dev;
  var year = req.body.order.purchased_at.slice(0, 4);
  var month = req.body.order.purchased_at.slice(5, 7);

  return db.getAOVandStdDev(year, month)
    .then(AOVresult => {
      // console.log('aov result', AOVresult)
      avg = AOVresult[0].avg;
      std_dev = AOVresult[0].std_dev;
      return db.addNewOrderPlusStdDev(req.body, avg, std_dev)
    })
    .then(result => {
      return db.addAllItems(req.body.order.items);
    })
    .then(result => {
      return db.addPurchaseDate(req.body.order)
    })
    .then(result => {
      res.sendStatus(200);
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
    })
    .catch(error => {
      console.log('ERROR in POST /order!: ', error);
      res.sendStatus(500);
    })
})



app.post('/inventoryinfo', (req, res) => {
	//check if quantity is sufficient, else decline
	//if sufficient, add wholesale price to db
	var order_id;
	var wholesale_total = 0;
	return Promise.all(
		req.body.items.map(function(itemObj) {
			order_id = itemObj.order_id;
			wholesale_total += itemObj.wholesale_price;
			return db.addInventoryDataToItem(itemObj)
		})
	)
	.then(result => {
		// console.log("RESULT FROM ADDING INV DATA", result)
		return db.addWholesaleTotal(order_id, wholesale_total)
	})
	.then(result => {
		// console.log('added inventory data successfully!', wholesale_total)
		res.sendStatus(200);
	})
	.catch((error) => {
		console.log("ERROR in POST /inventoryinfo! ", error);
		res.sendStatus(500);
	})
})

app.post('/fraudscore', (req, res) => {
	return db.addFraudScore(req.body)
		.then(result => {
			res.sendStatus(200);
		})
		.catch(error => {
			console.log('ERROR from POST /fraudscore', error)
			res.sendStatus(500);
		})
})