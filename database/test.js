const mysql = require('mysql');
const Promise = require('bluebird');
const moment = require('moment');

const mysqlConfig = {
  host: process.env.DBSERVER || 'localhost',
  user: process.env.DBUSER || 'root',
  password: process.env.DBPASSWORD || '',
  database: process.env.DBNAME || 'orders_API_test'
};

var mysqlConnection = mysql.createConnection(mysqlConfig);

mysqlConnection.connect(function(err) {
	if (err) {
		console.log('Could not connect to database', err);
	} else {
		console.log('Connected to db');
	}
})

var connection = Promise.promisifyAll(mysqlConnection);

/*====================================================
TO CLEAR TEST DATABASE: 
Run: mysql -u root < schema_test.sql
====================================================*/

/*====================================================
Input: An order object received from User Activity API.
Output: 
====================================================*/
const addNewOrder = (orderObj) => {
  var order_id = orderObj.order.id;
  var user_id = orderObj.order.user_id;
  var billing_name = orderObj.order.billing_address.name;
  var billing_street = orderObj.order.billing_address.street;
  var billing_city = orderObj.order.billing_address.city;
  var billing_state = orderObj.order.billing_address.state;
  var billing_ZIP = orderObj.order.billing_address.zip;
  var billing_country = orderObj.order.billing_address.country;
  var shipping_name = orderObj.order.shipping_address.name;
  var shipping_street = orderObj.order.shipping_address.street;
  var shipping_city = orderObj.order.shipping_address.city;
  var shipping_state = orderObj.order.shipping_address.state;
  var shipping_ZIP = orderObj.order.shipping_address.zip;
  var shipping_country = orderObj.order.shipping_address.country;
  var total_price = orderObj.order.total_price;
  var card_num = orderObj.order.card.num;
  var purchased_at = orderObj.order.purchased_at;
  
  var orderValues = [order_id, user_id, billing_name, billing_street, billing_city, billing_state, billing_ZIP, billing_country, shipping_name, shipping_street, shipping_city, shipping_state, shipping_ZIP, shipping_country, total_price, card_num];
  var userOrderQuery = 'INSERT INTO user_order (order_id, user_id, billing_name, billing_street, billing_city, billing_state, billing_ZIP, billing_country, shipping_name, shipping_street, shipping_city, shipping_state, shipping_ZIP, shipping_country, total_price, card_num) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

  return connection.queryAsync(userOrderQuery, orderValues);
}

const addItem = (itemObj) => {
  var itemValues = [itemObj.order_id, itemObj.id, itemObj.quantity, itemObj.listed_price, itemObj.seller_id];
  // var itemQuery = 'INSERT INTO item (order_id, item_id, quantity, listed_price) VALUES (?, ?, ?, ?)';
  var itemQuery = 'INSERT INTO item (order_id, item_id, quantity, listed_price, seller_id) VALUES (?, ?, ?, ?, ?)';
  return connection.queryAsync(itemQuery, itemValues);
}

const getItems = (order_id) => {
  var itemQuery = `SELECT * FROM item WHERE order_id = ${order_id}`;
  return connection.queryAsync(itemQuery);
}

const addPurchaseDate = (orderObj) => {
  var purchased_at = moment(orderObj.purchased_at).format("YYYY-MM-DD HH:mm:ss");
  // var dateQuery = `INSERT INTO order_history (order_id, purchased_at) VALUES (${orderObj.id}, \"${orderObj.purchased_at}\")`;
  var dateQuery = `INSERT INTO order_history (order_id, purchased_at) VALUES (${orderObj.id}, "${purchased_at}")`
  return connection.queryAsync(dateQuery);
}

const getPurchaseDate = (order_id) => {
  var dateQuery = `SELECT purchased_at FROM order_history WHERE order_id = ${order_id}`;
  return connection.queryAsync(dateQuery);
}

const getDeclinedDate = (order_id) => {
  var dateQuery = `SELECT declined_at FROM order_history WHERE order_id = ${order_id}`;
  return connection.queryAsync(dateQuery);
}

const updateOrderHistory = (field, date, order_id) => {
  var dateQuery = `UPDATE order_history SET ${field} = "${date}" WHERE order_id = ${order_id}`;
  return connection.queryAsync(dateQuery);
}

const addFraudScore = (analyticsObj) => {
  // console.log('fraud obj', analyticsObj);
  // var fraudQuery = `UPDATE user_order SET fraud_score = ${analyticsObj.fraud_score} WHERE order_id = ${analyticsObj.order_id}`;
  var fraudQuery = `UPDATE user_order SET fraud_score = ${analyticsObj.order.fraud_score} WHERE order_id = ${analyticsObj.order.order_id}`;
  return connection.queryAsync(fraudQuery);
}

const getFraudScore = (order_id) => {
  var fraudQuery = `SELECT fraud_score FROM user_order WHERE order_id = ${order_id}`;
  return connection.queryAsync(fraudQuery);
}

const getWholesaleTotal = (order_id) => {
  var query = `SELECT wholesale_total FROM user_order WHERE order_id = ${order_id}`;
  return connection.queryAsync(query);
}

//THIS HAS BEEN UPDATED
const addInventoryDataToItem = (inventoryObj) => {
  var itemQuery = `UPDATE item SET wholesale_price = ${inventoryObj.wholesale_price} WHERE order_id = ${inventoryObj.order_id} AND item_id = ${inventoryObj.id} AND seller_id = ${inventoryObj.seller_id}`;
  return connection.queryAsync(itemQuery);
}

const addWholesaleTotal = (order_id, wholesale_total) => {
  var orderQuery = `UPDATE user_order SET wholesale_total = ${wholesale_total} WHERE order_id = ${order_id}`;
  return connection.queryAsync(orderQuery);
}

const getAOVandStdDev = (year, month) => {
  var lastYear = year - 1;
  var aov_query = `SELECT avg, std_dev FROM average_order_value WHERE year = ${lastYear} AND month = ${month}`;
  return connection.queryAsync(aov_query);
}

const addStandardDev = (order_id, total_price, avg, std_dev) => {
  var delta = Math.floor(total_price - avg);
  var std_dev_from_AOV = Math.round((delta * 100000)/ (std_dev * 100000) * 100000) / 100000; 
  
  var std_dev_query = `UPDATE user_order SET std_dev_from_aov = ${std_dev_from_AOV} WHERE order_id = ${order_id}`;
  return connection.queryAsync(std_dev_query);
} 

const getOrderByOrderId = (order_id) => {
  var orderQuery = `SELECT * FROM user_order WHERE order_id = ${order_id}`;
  return connection.queryAsync(orderQuery);
}

const getOrderById = (id) => {
  var orderQuery = `SELECT order_id FROM user_order WHERE id = ${id}`;
  return connection.queryAsync(orderQuery);
}

const constructObjToAnalytics = (order_id) => {
  let orderObj = {};
  var orderQuery = `SELECT * FROM user_order, item, order_history WHERE item.order_id = ${order_id} AND user_order.order_id = ${order_id} AND order_history.order_id = ${order_id}`;
  return connection.queryAsync(orderQuery);
}

const constObjToInventory = (order_id) => {
  let itemObj = {};
  var itemQuery = `SELECT * FROM item WHERE order_id = ${order_id}`;
  return connection.queryAsync(itemQuery);
}

const getOrdersBetweenDates = (startDate, endDate) => {
  var orderQuery = `SELECT * FROM user_order WHERE order_id IN (SELECT order_id FROM order_history WHERE purchased_at >= "${startDate}" and purchased_at <= "${endDate}")`;
  return connection.queryAsync(orderQuery);
}

const getOrdersWithFraudScoresAbove = (fraud_score) => {
  var orderQuery = `SELECT * FROM user_order WHERE fraud_score > ${fraud_score}`;
  return connection.queryAsync(orderQuery);
}

const getChargeBacksBetweenDates = (startDate, endDate) => {
  var orderQuery = `SELECT * FROM user_order WHERE order_id IN (SELECT order_id FROM order_history WHERE chargedback_at >= "${startDate}" and chargedback_at <= "${endDate}")`;
  return connection.queryAsync(orderQuery);
}

const getOrdersToBeProcessed = () => {
  var orderQuery = `SELECT order_id FROM order_history WHERE confirmed_at IS NULL AND declined_at IS NULL`;
  return connection.queryAsync(orderQuery);
}

const getWholesaleAndFraud = (order_id) => {
  var orderQuery = `SELECT wholesale_total, fraud_score FROM user_order WHERE order_id = ${order_id}`;
  return connection.queryAsync(orderQuery);
}


module.exports = {
  connection,
  addNewOrder,
  addFraudScore,
  addItem,
  addInventoryDataToItem,
  addPurchaseDate,
  addWholesaleTotal,
  getAOVandStdDev,
  addStandardDev,
  updateOrderHistory,
  getOrdersBetweenDates,
  getOrdersWithFraudScoresAbove,
  getChargeBacksBetweenDates,
  getOrderByOrderId,
  constructObjToAnalytics,
  constObjToInventory,
  getPurchaseDate,
  getOrderById,
  getItems,
  getFraudScore,
  getDeclinedDate,
  getWholesaleTotal,
  getOrdersToBeProcessed,
  getWholesaleAndFraud,
}




