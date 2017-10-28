const bodyParser = require('body-parser');
const elasticsearch = require('elasticsearch');
const express = require('express');
const Promise = require('bluebird');

const db = require('../database/index.js')

const app = express()
const PORT = process.env.PORT || 3000;

//Elastic Search==========================
var client = new elasticsearch.Client({
	host: 'localhost:9200',
	log: 'trace'
});



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

app.post('/order', (req, res) => {
	var order_id = req.body.order.id;
	var total_price = req.body.order.total_price;
	var avg;
	var std_dev;
	return db.addNewOrder(req.body)
		.then(result => {
			return Promise.all(
				req.body.items.map(function (itemObj) {
					db.addItem(itemObj);
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