const faker = require('faker');
const moment = require('moment');
const axios = require('axios');
const Promise = require('bluebird');
const cron = require('node-cron');

// const db = require('../database/index.js')

/*===========================================
Input: A minimum and maximum integer
Output: A randomly generated number inclusive of the min and max.
===========================================*/
var randomNumberGenerator = (min, max) => { 
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/*===========================================
Input: None
Output: Billing address object
===========================================*/
var createAddress = () => {
  var billing_address = {
    id: 1,
    name: faker.name.findName(),
    street: faker.address.streetAddress(),
    city: faker.address.city(),
    state: faker.address.stateAbbr(),
    country: 'USA',
    zip: faker.address.zipCode()
  }
  return billing_address;
}

/*===========================================
Input: Billing address object
Output: Shipping address with the same format as billing address
Function: 95% of the time returns the same billing_address, but 5% it creates a new address for shipping.
===========================================*/
var createShipping = (billing_address) => { //consider only changing the first name but not the last name
  var shipping_address = {};
  var num = randomNumberGenerator(1, 100);
  if (num >= 95) {
    shipping_address = createAddress();
  } else {
    shipping_address = billing_address;
  }
  return shipping_address;
}
/*===========================================
Input: Order id (number)
Output: A single item associated with the given order number
===========================================*/
var createItem = (order_id) => {
  var item = {
    id: randomNumberGenerator(1, 300000),
    order_id: order_id,
    quantity: randomNumberGenerator(1, 4),
    listed_price: faker.commerce.price(.99, 200, 2),
  }
  return item;
}



/*===========================================
Input: Order id (number)
Output: An array of items associated with the given order number
Function: Generates any number of items between 1 and 5
===========================================*/
var createItemArray = (order_id) => {
  var quantity = randomNumberGenerator(1, 5);
  var items = []
  for (var i = 0; i < quantity; i++) {
    items.push(createItem(order_id))
  }

  return items;
}

// var item_array = createItemArray(12345);
// console.log('item array!', item_array);


/*===========================================
Input: Item object
Output: See structure below: 
  { 
    id: 90,
    order_id: 8,
    wholesale_price: 24.99,
    quantity: 10 
  }
Function: Simulates the response typically received from Inventory for a single item in the array response.
===========================================*/
var generateItemInventoryInfo = (item) => {
  var inventoryInfo = {};
  inventoryInfo.id = item.id;
  inventoryInfo.seller_id = 1;
  inventoryInfo.order_id = item.order_id;
  inventoryInfo.quantity = randomNumberGenerator(15, 1000);
  inventoryInfo.wholesale_price = Math.round((item.listed_price * (randomNumberGenerator(50, 99) / 100)) * 100) / 100;
  return inventoryInfo;
}
/*===========================================
Input: Array of purchased items.
Output: See structure below: 
{ items: [ 
  {
    id: 3,
    order_id: 7,
    wholesale_price: 20.00,
    quantity: 2 
  },{ 
    id: 90,
    order_id: 8,
    wholesale_price: 24.99,
    quantity: 10 
  }]
}
Function: Simulates the response typically received from Inventory
===========================================*/
var generateItemArrayInventoryInfo = (item_array) => {
  var inventoryInfoArray = [];
  for (var i = 0; i < item_array.length; i++) {
    inventoryInfoArray.push(generateItemInventoryInfo(item_array[i]))
  }
  return {items: inventoryInfoArray};
}

// var inventorydata = {items: generateItemArrayInventoryInfo(item_array)};
// console.log('inventory data!', inventorydata);

/*===========================================
Input: Average Order Value and its standard deviation (for that month) along with the total order price.
Output: Number of standard deviations this total_price is away from AOV for that month. For example, if
        the average order value (AOV) is $30.00 and the standard deviation is $3.00, the returned value
        for a total order price of $31.00 will be 0.33333.
Function: Ensures that the number of decimal places is only 5.
===========================================*/
var calculateStdDevFromAOV = (AOV, stdDev, total_price) => { //may need a quick way to grab this data, cache?
  var delta = Math.floor(total_price - AOV);
  var std_dev_from_AOV = Math.round((delta * 100000)/ (stdDev * 100000) * 100000) / 100000; 
  return std_dev_from_AOV;
}

// console.log('standard dev', calculateStdDevFromAOV(30.00, 3.00, 31.00));

/*===========================================
Input: Id of order to assign fraud score to
Output: A randomly generated fraud score (~95% of scores under 10, 5% between 50 and 100);
===========================================*/
var generateFraudScoreObj = (order_id) => {
  var randomNumber = randomNumberGenerator(0, 100);
  if (randomNumber >= 95) {
    return {order: {order_id: order_id, fraud_score: randomNumberGenerator(50, 100)}}; //THIS HAS BEEN CHANGED
  } else {
    return {order: {order_id: order_id, fraud_score: randomNumberGenerator(1, 10)}}; //THIS HAS BEEN CHANGED
  }
}



/*===========================================
Input: Number of orders currently in the order database
Output: Number of standard deviations this total_price is away from AOV for that month
Function: Uses faker to generate simulated data. 
===========================================*/
var constructInFlightOrderData = (numRowsInOrderDB) => {
    var orderObj = {}
    var nextRow = numRowsInOrderDB;
    // console.log(nextRow, numRowsInOrderDB)
    orderObj.order = {
      id: nextRow, //need to generate numbers sequentially
      user_id: nextRow, //might want to repeat these periodically
      purchased_at: moment(faker.date.between('2017-07-25', '2017-10-25')).utc().format("YYYY-MM-DD HH:mm:ss"),
      total_price: faker.commerce.price(.99, 500, 2), //create distribution?
      card: {
        id: nextRow,
        num: faker.finance.account(16)
      },
      billing_address: createAddress(),
    }
    orderObj.order.shipping_address = createShipping(orderObj.order.billing_address);
    orderObj.order.items = createItemArray(nextRow);
    // console.log(orderObj)
    return orderObj;
}

var generateOrderRequest = (lastRowNum) => { //this can be done without http calls
  
  var i = lastRowNum + 1;
  var orderObj = constructInFlightOrderData(i);
  axios.post('http://127.0.0.1:3000/order', orderObj)
    .then(res => {
      return generateItemArrayInventoryInfo(orderObj.order.items)
    })
    .then(items => {
      return axios.post('http://127.0.0.1:3000/inventoryinfo', items) //it doesn't like something about this format
    })
    .then(res => {
      return generateFraudScoreObj(i)
    })
    .then(scoreObj => {
      return axios.post('http://127.0.0.1:3000/fraudscore', scoreObj)
    })
    .then(res => {
      console.log(i, " inserted");
    })
    .catch(err => {
      console.log("ERROR: ", err);
    }) 

}

var generateOrdersWithoutRequests = (lastRowNum) => {
  var i = lastRowNum + 1;
  var orderObj = constructInFlightOrderData(i);
  var order_id = orderObj.order.id;
  var total_price = orderObj.order.total_price;
  var wholesale_total = 0;
  var avg;
  var std_dev;
  return db.addNewOrder(orderObj)
  .then(result => {
    return Promise.all(
      orderObj.items.map(function (itemObj) {
        db.addItem(itemObj);
      })
    )
    .then((result) => {
      return db.addPurchaseDate(orderObj.order)
    })
    .then(result => {
      var year = orderObj.order.purchased_at.slice(0, 4);
      var month = orderObj.order.purchased_at.slice(5, 7);
      return db.getAOVandStdDev(year, month)
    })
    .then(AOVresult => {
      avg = AOVresult[0].avg;
      std_dev = AOVresult[0].std_dev;
      return db.addStandardDev(order_id, total_price, avg, std_dev);
    })
    .then(result => {
      return generateFraudScoreObj(i);
    })
    .then(scoreObj => {
      return db.addFraudScore(scoreObj);
    })
    .then(result => {
      return generateItemArrayInventoryInfo(orderObj.items)
    })
    .then(inventoryObj => {
      // res.sendStatus(200);
      // console.log(i, ' inserted');
      return Promise.all(
        inventoryObj.items.map(function(itemObj) {
          wholesale_total += itemObj.wholesale_price;
          db.addInventoryDataToItem(itemObj)
        })
      )
    })
    .then(result => {
      return db.addWholesaleTotal(order_id, wholesale_total)
    })
    .then(result => {
      // console.log('added inventory data successfully!', wholesale_total)
      // console.log(i, " inserted");
      // res.sendStatus(200);
    })      
    .catch((error) => {
      console.log(`ERROR w/ ${i} order `, error);
      // res.sendStatus(500);
    })
  })
  .catch(error => {
    console.log(`ERROR w/ ${i} order `, error);
    // res.sendStatus(500);
  })

}
/*===========================================
Input:  numOrders = number of orders to generate
        numRowsInOrderDB = last order id generated (to ensure no duplicates)
Output: Many in-flight order objects, number matches numOrders 
===========================================*/
var generateMultipleOrders = (numOrders, numRowsInOrderDB) => {
  let i = numRowsInOrderDB;
  while (i < numOrders + numRowsInOrderDB) {
    generateOrderRequest(i)
    i++
  }
  // console.log(`inserted ${numOrders} rows`);
}


var generateMultipleOrdersWithoutRequest = (numOrders, numRowsInOrderDB) => {
  let i = numRowsInOrderDB;
  while (i < numOrders + numRowsInOrderDB) {
    generateOrderRequest(i)
    i++
  }
}

var numOrders = 50;
var numRowsInOrderDB = 20000000;
var j = 1;
var task = cron.schedule('0-55 * * * * *', function() {
  console.log(`ran task ${j++}`);
  generateMultipleOrders(numOrders, numRowsInOrderDB);
  numRowsInOrderDB+=numOrders
})
task.start();
// console.log('fraud score', generateFraudScoreObj(12345))
//26765

// generateOrderRequest(1, 1);
// generateMultipleOrders(1, 24758);
// generateOrdersWithoutRequests(24760);
// generateMultipleOrdersWithoutRequest(2000, 26765);


