const faker = require('faker');
const moment = require('moment')

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
    id: randomNumberGenerator(1, 3000000000),
    order_id: order_id,
    quantity: randomNumberGenerator(1, 20),
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

var item_array = createItemArray(12345);
console.log('item array!', item_array);


/*===========================================
Input: Order id number
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
  return inventoryInfoArray;
}

var inventorydata = {items: generateItemArrayInventoryInfo(item_array)};
console.log('inventory data!', inventorydata);

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
Input: Number of orders currently in the order database
Output: Number of standard deviations this total_price is away from AOV for that month
Function: Uses faker to generate simulated data. 
===========================================*/
var constructInFlightOrderData = (numRowsInOrderDB) => {
    var orderObj = {}
    var nextRow = numRowsInOrderDB++
    orderObj.order = {
      id: nextRow, //need to generate numbers sequentially
      user_id: nextRow, //might want to repeat these periodically
      purchased_at: moment(faker.date.between('2017-07-25', '2017-10-25')).utc().format("YYYY-MM-DD HH:mm:ss"),
      total_price: faker.commerce.price(.99, 2000, 2), //create distribution?
      card: {
        id: nextRow,
        num: faker.finance.account(16)
      },
      billing_address: createAddress(),
    }
    orderObj.order.shipping_address = createShipping(orderObj.order.billing_address);
    orderObj.items = createItemArray(nextRow);
    // console.log(orderObj)
    return orderObj;
}


var generateMultipleOrders = (numOrders, numRowsInOrderDB) => {
  var i = numRowsInOrderDB + 1;
  while (i <= numOrders + numRowsInOrderDB) {
    constructInFlightOrderData(i)
    i++
  }
}

var generateFraudScoreObj = (order_id) => {
  var randomNumber = randomNumberGenerator(0, 100);
  if (randomNumber >= 95) {
    return {order_id: order_id, fraud_score: randomNumberGenerator(50, 100)};
  } else {
    return {order_id: order_id, fraud_score: randomNumberGenerator(1, 10)};
  }
}

// console.log('fraud score', generateFraudScoreObj(12345))


generateMultipleOrders(2, 205);



