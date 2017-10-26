const mysql = require('mysql');
const Promise = require('bluebird');

const mysqlConfig = {
  host: process.env.DBSERVER || 'localhost',
  user: process.env.DBUSER || 'root',
  password: process.env.DBPASSWORD || '',
  database: process.env.DBNAME || 'orders_API'
};

var connection = mysql.createConnection(mysqlConfig);

connection.connect(function(err) {
	if (err) {
		console.log('Could not connect to database', err);
	} else {
		console.log('Connected to db');
	}
})

// var connection = Promise.promisifyAll(mysqlConnection);
// console.log('connection', connection)


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

  return new Promise(function(resolve, reject) {
    connection.query(userOrderQuery, orderValues, function(err, results) { //use queryAsync instead!!
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    })
  })
  /*
  will the date format be '2017-10-25 23:42:07'?
  */
}

const addFraudScore = (analyticsObj) => {
  console.log('fraud obj', analyticsObj);
  res.send('ok')
  // return new Promise(function(resolve, reject) {
  //   connection.query(userOrderQuery, orderValues, function(err, results) { //use queryAsync instead!!
  //     if (err) {
  //       reject(err);
  //     } else {
  //       resolve(results);
  //     }
  //   })
  // })
}




module.exports = {
  addNewOrder,
  addFraudScore,
}



