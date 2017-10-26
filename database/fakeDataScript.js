const faker = require('faker');
const moment = require('moment')

var randomNumberGenerator = (min, max) => { //min and max inclusive
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

var date = moment().utc().format("YYYY-MM-DD HH:mm:ss");

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

var createItem = (order_id) => {
  var item = {
    id: randomNumberGenerator(1, 3000000000),
    order_id: order_id,
    quantity: randomNumberGenerator(1, 20),
    listed_price: faker.commerce.price(.99, 200, 2),
  }
  return item;
}

var createItemArray = (order_id) => {
  var quantity = randomNumberGenerator(1, 10);
  var items = []
  for (var i = 0; i < quantity; i++) {
    items.push(createItem(order_id))
  }
  return items;
}

var constructInFlightOrderData = (numRowsInOrderDB) => {
    var orderObj = {}
    var nextRow = numRowsInOrderDB++
    orderObj.order = {
      id: nextRow, //need to generate numbers sequentially
      user_id: nextRow, //might want to repeat these periodically
      purchased_at: moment().utc().format("YYYY-MM-DD HH:mm:ss"), //might want to space them out
      total_price: faker.commerce.price(.99, 2000, 2), //create distribution?
      card: {
        id: nextRow,
        num: faker.finance.account(16)
      },
      billing_address: createAddress(),
    }
    orderObj.order.shipping_address = createShipping(orderObj.order.billing_address);
    orderObj.items = createItemArray(nextRow);
    return orderObj;
}
var generateMultipleOrder = (numOrders, numRowsInOrderDB) => {
  var i = numRowsInOrderDB + 1;
  while (i <= numOrders + numRowsInOrderDB) {
    constructInFlightOrderData(i)
    i++
  }
}

generateMultipleOrder(2, 205);



