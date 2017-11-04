const moment = require("moment");

// let lastOrderHandled = 1;
// let fraudLimit = 75;

// let ordersToBeProcessed = [];

//ordersToBeProcessed = return orders that do not have either confirm or decline date
//for these orders check if they've had their fraud score and wholesale total calculated
//if yes, determine if fraud score is lower than limit

//HOW DO I KNOW IF QUANTITY IS ADEQUATE
	//if wholesale total is filled in (only fill this in when order inv qty is sufficient?) AND confirmed_at isn't
	//if fraud score is filled in and below threshold

//OR ON LISTENERS CHECK IF INFO IS THERE FOR OTHER FACTORS

const db = require('../database/test.js')

// const declineOrder = (order_id) => {
//   var now = moment().format("YYYY-MM-DD HH:mm:ss");
//   return db.updateOrderHistory("declined_at", now, order_id)
// }

// declineOrder(48356);

// const isFraudScoreAvail = (order_id) => {
//   return db.getFraudScore(order_id)
//   .then(result => {
//   	console.log(typeof result[0].fraud_score)
//   	return result[0].fraud_score
//   })
//   .catch(err => {
//     console.log('uh oh, got an error', err);
//   })
// }

// isFraudScoreAvail(48356)
/*
INSERT INTO user_order (order_id, user_id, billing_name, billing_street, billing_city, billing_state, billing_ZIP, billing_country, shipping_name, shipping_street, shipping_city, shipping_state, shipping_ZIP, shipping_country, total_price, card_num) 
VALUES (6, 1, 'Tiffany A Barth', '1 Cedar Street Apt #2', 'Worcester', 'MA', '01609-1234', 'USA', 'Tiffany A Barth', '1 Cedar Street Apt #2', 'Worcester', 'MA', 01609, 'USA', 331.99, 1234123412341234);

INSERT INTO item (order_id, item_id, quantity, listed_price, seller_id) VALUES (6, 178, 3, 31.99, 1);
INSERT INTO item (order_id, item_id, quantity, listed_price, seller_id) VALUES (6, 179, 2, 200.00, 1);

UPDATE user_order SET fraud_score = 10 WHERE order_id = 6;

INSERT INTO order_history (order_id, purchased_at) VALUES (6, '2017-10-25 23:42:07');


UPDATE order_history SET declined_at = '2017-10-25 23:42:07' WHERE order_id = 6;
*/
//INSUFFICIENT QTY:
var items = JSON.parse('[{"id":178,"seller_id":1,"wholesale_price":20,"quantity":1,"order_id":6},{"id":179,"seller_id":1,"wholesale_price":19,"quantity":1,"order_id":6}]');

//SUFFICIENT QTY:
// var items = JSON.parse('[{"id":178,"seller_id":1,"wholesale_price":20,"quantity":20,"order_id":6},{"id":179,"seller_id":1,"wholesale_price":19,"quantity":20,"order_id":6}]');

//ADD FRAUD SCORE ABOVE LIMIT
//UPDATE user_order SET fraud_score = 100 WHERE order_id = 6;

//ADD FRAUD SCORE BELOW LIMIT
//UPDATE user_order SET fraud_score = 1 WHERE order_id = 6;
// var items = JSON.parse('[{"id":178,"seller_id":1,"wholesale_price":20,"quantity":20,"order_id":6},{"id":179,"seller_id":1,"wholesale_price":19,"quantity":20,"order_id":6}]');


var fraud_limit = 75;
// console.log(items);
// console.log(typeof items)
// console.log(items[0].quantity)

const isInvQtySufficient = (purchasedItems, invItems) => {
  let isQtySufficient = true;
  purchasedItems.forEach(function(purchasedItem, index) {
    if (purchasedItem.quantity > invItems[index].quantity) {
      isQtySufficient = false
    }
  })
  return isQtySufficient;
}

const declineOrder = (order_id) => {
  let now = moment().format("YYYY-MM-DD HH:mm:ss");
  return db.updateOrderHistory("declined_at", now, order_id)
}

const confirmOrder = (order_id) => {
  let now = moment().format("YYYY-MM-DD HH:mm:ss");
  return db.updateOrderHistory("confirmed_at", now, order_id)
}

const isFraudScoreAvail = (order_id) => {
  return db.getFraudScore(order_id)
  .then(result => {
    if (result[0].fraud_score === null) {
      // console.log(result[0].fraud_score)
      return null;
    } else {
      return result[0].fraud_score
    }
  })
  .catch(err => {
    console.log('ERROR: ', err);
  })
}

const handleInvCheck = (items) => {
    let wholesale_total = 0;
    let order_id = items[0].order_id
    return db.getDeclinedDate(order_id)
      .then(result => {
        console.log(result);
        if (result[0].declined_at === null) {
          return db.getItems(order_id)
              .then(purchasedItems => {
                if (isInvQtySufficient(purchasedItems, items)) {
                  return Promise.all(
                    items.map(function(itemObj, index) {
                      order_id = itemObj.order_id;
                      wholesale_total += itemObj.wholesale_price * purchasedItems[index].quantity; //THIS HAS BEEN UPDATED
                      return db.addInventoryDataToItem(itemObj)
                    })
                  )
                  .then(result => {
                    return isFraudScoreAvail(order_id)
                  })
                  .then(fraud_score => {
                    if (typeof fraud_score === "number") {
                      if (fraud_score < fraud_limit) {
                        console.log("CONFIRMED ORDER")
                        return confirmOrder(order_id)
                      } else {
                        console.log("DECLINED ORDER, FRAUD SCORE TOO HIGH")
                        return declineOrder(order_id)
                      }
                    } 
                  })
                } else {
                  console.log("DECLINED ORDER, QTY NOT SUFFICIENT")
                  return declineOrder(order_id)
                }
              })
        } else {
          console.log("ALREADY HAS ALREADY BEEN DECLINED");
          return result[0].declined_at;
          // return "declined"
        }
      })
      .then(result => {
        return db.addWholesaleTotal(order_id, wholesale_total)
      })
      .then(result => {
        console.log("SUCCESSFULLY RECEIVED QTY CHECK FROM INVENTORY")
        // done();
      })
      .catch(err => {
        console.log("ERROR: ", err);
      })
}

handleInvCheck(items)





