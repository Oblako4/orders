const db = require('../database/index.js');
const connection = db.connection;
const Promise = require('bluebird');
const cron = require('node-cron');

var getMissingFraudScore = () => {
	var query = 'SELECT order_id FROM user_order WHERE fraud_score is NULL LIMIT 20';
	return connection.queryAsync(query);
}

var getItemsMissingInfo = () => {
	var query = 'SELECT order_id FROM item WHERE wholesale_price is NULL LIMIT 1';
	return connection.queryAsync(query);
}

var getItemsByOrder = (order_id) => {
	var query = `SELECT order_id, item_id, listed_price FROM item WHERE order_id = ${order_id}`;
	return connection.queryAsync(query);
}

var randomNumberGenerator = (min, max) => { 
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var generateFraudScoreObj = (order_id) => {
  var randomNumber = randomNumberGenerator(0, 100);
  if (randomNumber >= 95) {
    return {order_id: order_id, fraud_score: randomNumberGenerator(50, 100)};
  } else {
    return {order_id: order_id, fraud_score: randomNumberGenerator(1, 10)};
  }
}

const addFraudScore = (analyticsObj) => {
  // console.log('fraud obj', analyticsObj);
  var fraudQuery = `UPDATE user_order SET fraud_score = ${analyticsObj.fraud_score} WHERE order_id = ${analyticsObj.order_id}`;
  return connection.queryAsync(fraudQuery);
}

const fixMissingFraudScore = () => {
	var i = 1;
	return getMissingFraudScore()
	.then((results) => {
		// console.log(results[0].order_id)
		return Promise.all(
			results.map(function(result) {
				console.log(result.order_id)
				return generateFraudScoreObj(result.order_id)
			})
		)
	})
	.then(scoreObjs => {
		return Promise.all(
			scoreObjs.map(function(scoreObj) {
				console.log(scoreObj);
				return addFraudScore(scoreObj)
			})
		)
	})
	.then(result => {
		console.log(`finished ${i}`);
		i++;
	})
	.catch(error => {
		console.log('ERROR ', error);
	})
}

var generateItemInventoryInfo = (item) => {
  var inventoryInfo = {};
  inventoryInfo.item_id = item.item_id;
  inventoryInfo.seller_id = 1;
  inventoryInfo.order_id = item.order_id;
  inventoryInfo.quantity = randomNumberGenerator(15, 1000);
  inventoryInfo.wholesale_price = Math.round((item.listed_price * (randomNumberGenerator(50, 99) / 100)) * 100) / 100;
  return inventoryInfo;
}

var generateItemArrayInventoryInfo = (item_array) => {
  var inventoryInfoArray = [];
  for (var i = 0; i < item_array.length; i++) {
    inventoryInfoArray.push(generateItemInventoryInfo(item_array[i]))
  }
  return {items: inventoryInfoArray};
}

const addInventoryDataToItem = (inventoryObj) => {
  var itemQuery = `UPDATE item SET wholesale_price = ${inventoryObj.wholesale_price}, seller_id = ${inventoryObj.seller_id} WHERE order_id = ${inventoryObj.order_id} AND item_id = ${inventoryObj.item_id}`;
  console.log(itemQuery)
  return connection.queryAsync(itemQuery);
}

const fixMissingWholesaleTotal = () => {
	var order_id;
	var wholesale_total = 0;
	return getItemsMissingInfo()
	.then(results => {
		return getItemsByOrder(results[0].order_id)
	})
	.then(results => {
		return generateItemArrayInventoryInfo(results)
	})
	.then(results => {
		return Promise.all(
			results.items.map(function(item) {
				order_id = item.order_id;
				wholesale_total += item.wholesale_price;
				return addInventoryDataToItem(item)
			})
		)
    .then(result => {
      console.log(result);
      return db.addWholesaleTotal(order_id, wholesale_total)
    })
    .then(result => {
      console.log(`finished ${order_id}`);
    })
	})
	.catch((error) => {
		console.log("ERROR: ", error);
	})
}


var j = 1;
var task = cron.schedule('0-59 * * * * *', function() {
  console.log(`ran task ${j++}`);
  fixMissingWholesaleTotal()
})
task.start();


// var j = 1;
// var task = cron.schedule('0-59 * * * * *', function() {
//   console.log(`ran task ${j++}`);
//   fixMissingFraudScore();
// })
// task.start();

