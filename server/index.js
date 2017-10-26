const express = require('express');
const bodyParser = require('body-parser');
const Promise = require('bluebird');

const db = require('../database/index.js')

const app = express()
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`listening on port ${PORT}`);
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.post('/order', (req, res) => {
	return db.addNewOrder(req.body)
		.then(result => {
			// console.log('RESULT: ', result);
			return Promise.all(
				req.body.items.map(function (itemObj) {
					db.addItem(itemObj);
				})
			)
			.then((result) => {
				// console.log('success w/ promise.all!')
				return db.addPurchaseDate(req.body.order)
			})
			.then(result => {
				// console.log('successfully added purchase date!')
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
	return db.addFraudScore(req.body.order)
		.then(result => {
			res.sendStatus(200);
		})
		.catch(error => {
			console.log('ERROR from POST /fraudscore', error)
			res.sendStatus(500);
		})
})