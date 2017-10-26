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
			res.send(result)
		})
		.catch(error => {
			console.log('ERROR: ', error);
		})
})

app.post('/fraudscore', (req, res) => {
	console.log('fraud score obj', req.body);
	res.send('ok')
	// return db.addFraudScore(req.body)
	// 	.then(result => {
	// 		res.send('ok');
	// 	})
	// 	.catch(error => {
	// 		console.log('ERROR: ', error);
	// 	})
})