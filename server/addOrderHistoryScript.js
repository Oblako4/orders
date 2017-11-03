const faker = require('faker');
const moment = require('moment');
const axios = require('axios');
const Promise = require('bluebird');
const cron = require('node-cron');

// const db = require('../database/index.js')
const db = require('../database/test.js')

var randomNumberGenerator = (min, max) => { 
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

db.getPurchaseDate(313)
.then(result => {
	console.log(result.purchased_at)
	var purchased_at = moment(result[0].purchased_at).format("YYYY-MM-DD HH:mm:ss");
	console.log('result: ', purchased_at)
	var confirmed_at;
	var randomNum = randomNumberGenerator(1, 100);
	if (randomNum >= 95) {
		var randomHours = randomNumberGenerator(24, 48)
		confirmed_at = moment(purchased_at).add(randomHours, 'hours').format("YYYY-MM-DD HH:mm:ss")
	} else {
		var randomHours = randomNumberGenerator(2, 5)
		confirmed_at = moment(purchased_at).add(randomHours, 'hours').format("YYYY-MM-DD HH:mm:ss")
	}
	console.log('confirmed_at: ', confirmed_at);
})
.catch(err => {
	console.log('ERROR: ', err);
})

db.getOrderById(1)
.then(result => {
	console.log('order_id', result.order_id)
})
.catch(err => {
	console.log('ERROR: ', err)
})