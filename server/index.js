const bodyParser = require('body-parser');
const elasticsearch = require('elasticsearch');
const express = require('express');
const Promise = require('bluebird');
const AWS = require('aws-sdk');
const Consumer = require('sqs-consumer');

// const db = require('../database/index.js') //PRODUCTION DATABASE
const db = require('../database/test.js') //TEST DATABASE
const mb = require('../messagebus/index.js')

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

app.get('/order', (req, res) => {
	if (req.query.gte && req.query.lte) { //add more validation for date format?
		return db.getOrdersBetweenDates(req.query.gte, req.query.lte).
			then(results => {
				res.send(results);
			})
			.catch(err => {
				console.log('ERROR in GET /order', err);
				res.sendStatus(500);
			})
	} else {
		res.sendStatus(500);
	}
})



app.get('/orderinfo/:order_id', (req, res) => {
	//construct outbound object
  let objToAnalytics = {}
  console.log('params ', req.params)
	return db.constructObjToAnalytics(req.params.order_id)
	.then(result => {
    // console.log('result: ', result);
    
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
    res.send(objToAnalytics);
  })
  .catch(error => {
    res.sendStatus(500);
  })
})


app.get('/qtycheck/:order_id', (req, res) => {
  let qtyCheckObj = {}
  qtyCheckObj.order_id = req.params.order_id
  return db.constObjToInventory(req.params.order_id)
  .then(result => {
    qtyCheckObj.items = []
    result.forEach(function(item) {
      var itemObj = {
        item_id: item.item_id,
        seller_id: item.seller_id
      }
      qtyCheckObj.items.push(itemObj)
    })
    res.send(qtyCheckObj);
  })
  .catch(error => {
    res.sendStatus(500);
  })
})

app.get('/qtyupdate/:order_id', (req, res) => {
  let qtyUpdateObj = {};
  return db.constObjToInventory(req.params.order_id)
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
    res.send(qtyUpdateObj);
  })
  .catch(error => {
    res.sendStatus(500);
  })
})


app.post('/order', (req, res) => {
	var order_id = req.body.order.id;
	var total_price = req.body.order.total_price;
	var avg;
	var std_dev;
	return db.addNewOrder(req.body)
		.then(result => {
			return Promise.all(
				req.body.order.items.map(function (itemObj) { //THIS HAS BEEN CHANGED MAY AFFECT OTHER AREAS
					return db.addItem(itemObj); //ADDED RETURN HERE
				})
			)
			.then((result) => {
				return db.addPurchaseDate(req.body.order)
			})
			.then(result => {
				var year = req.body.order.purchased_at.slice(0, 4);
				var month = req.body.order.purchased_at.slice(5, 7);
				return db.getAOVandStdDev(year, month)
			})
			.then(AOVresult => {
				// console.log('aov result', AOVresult)
				avg = AOVresult[0].avg;
				std_dev = AOVresult[0].std_dev;
				return db.addStandardDev(order_id, total_price, avg, std_dev);
			})
			.then(result => {
				res.sendStatus(200);
			})
			.catch((error) => {
				console.log("ERROR in POST /order! ", error);
				res.sendStatus(500);
			})
		})
		.catch(error => {
			console.log('ERROR in POST /order!: ', error);
			res.sendStatus(500);
		})
		// .error(err => {
		// 	console.log(err);
		// })
})

app.post('/inventoryinfo', (req, res) => {
	//check if quantity is sufficient, else decline
	//if sufficient, add wholesale price to db
	var order_id;
	var wholesale_total = 0;
	return Promise.all(
		req.body.map(function(itemObj) {
			order_id = itemObj.order_id;
			wholesale_total += itemObj.wholesale_price;
			db.addInventoryDataToItem(itemObj)
		})
	)
	.then(result => {
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