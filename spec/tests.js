const axios = require('axios');
var mysql = require('mysql');
var request = require('request'); 
var expect = require('chai').expect;
const db = require('../database/test.js');

describe('Database schema tests', function() {

  before(function() {
    var query = `TRUNCATE TABLE order_history`
    return db.connection.queryAsync(query)
    .then(result => {
      // console.log('table truncated')
      var query = `TRUNCATE TABLE item`
      return db.connection.queryAsync(query)
    })
    .then(result => {
      var query = `DELETE FROM user_order`;
      return db.connection.queryAsync(query);
    })
    .then(result => {
      console.log('Test db cleared')
    })
    .catch(err => {
      console.log('ERROR: ', err);
    })
  })



  it('Should insert orders into the database', function() {
    var query = `INSERT INTO user_order (order_id, user_id, billing_name, billing_street, billing_city, billing_state, billing_ZIP, 
    billing_country, shipping_name, shipping_street, shipping_city, shipping_state, shipping_ZIP, shipping_country, total_price, card_num) 
    VALUES (10001, 1, 'Tiffany A Barth', '1 Cedar Street Apt #2', 'Worcester', 'MA', '01609-1234', 'USA', 'Tiffany A Barth', 
    '1 Cedar Street Apt #2', 'Worcester', 'MA', 01609, 'USA', 331.99, '1234123412341234')`;

    return db.connection.queryAsync(query)
      .then(result => {
        expect(true).to.equal(true);
      })
      .catch(err => {
        expect(false).to.equal(true);
      })
  });


  it('Should not allow duplicate orders', function() {
    var query = `INSERT INTO user_order (order_id, user_id, billing_name, billing_street, billing_city, billing_state, billing_ZIP, 
    billing_country, shipping_name, shipping_street, shipping_city, shipping_state, shipping_ZIP, shipping_country, total_price, card_num) 
    VALUES (10001, 1, 'Tiffany A Barth', '1 Cedar Street Apt #2', 'Worcester', 'MA', '01609-1234', 'USA', 'Tiffany A Barth', 
    '1 Cedar Street Apt #2', 'Worcester', 'MA', 01609, 'USA', 331.99, '1234123412341234')`;

    return db.connection.queryAsync(query)
      .then(result => {
        expect(false).to.equal(true);
      })
      .catch(err => {
        expect(true).to.equal(true);
      })
  });

  it('Should insert purchase date into order_history table', function() {
    var query = `UPDATE order_history SET declined_at = '2017-10-25 23:42:07' WHERE order_id = 10001`;

    return db.connection.queryAsync(query)
      .then(result => {
        expect(true).to.equal(true);
      })
      .catch(err => {
        expect(false).to.equal(true);
      })
  });

  it('Columns fraud_score, wholesale_total, and std_dev_from_aov should initially be NULL', function() {
    var query = `SELECT order_id FROM user_order WHERE fraud_score IS NULL 
    AND wholesale_total IS NULL AND std_dev_from_aov IS NULL`;
    
    return db.connection.queryAsync(query)
      .then(result => {
        expect(result[0].order_id).to.equal(10001);
      })
      .catch(err => {
        expect(false).to.equal(true);
      })
  });

  it('Should allow multiple items per order to be inserted', function() {
    var query1 = `INSERT INTO item (order_id, item_id, quantity, listed_price, seller_id) VALUES (10001, 178, 3, 31.99, 1)`;
    var query2 = `INSERT INTO item (order_id, item_id, quantity, listed_price, seller_id) VALUES (10001, 179, 2, 200.00, 1)`;

    var confirmQuery = `SELECT * FROM item WHERE order_id = 10001`;
    return db.connection.queryAsync(query1)
      .then(result => {
        return db.connection.queryAsync(query2)
      })
      .then(result => {
        return db.connection.queryAsync(confirmQuery)
      })
      .then(result => {
        expect(result.length).to.equal(2);
      })
      .catch(err => {
        expect(false).to.equal(true);
      })
  });

});

describe('Server POST endpoint tests', function() {

  after(function() {
    return db.connection.endAsync()
      .then(result => {
        console.log('Connection ending')
      })
      .catch(err => {
        console.log('Cannot end connection', err);
      })
  })

  it('Should accept the in-flight object structure from Users API', function() {
    var in_flight = `{"order":{"id":971,"user_id":971,"purchased_at":"2017-11-04T20:43:32.000Z","card":{"id":971,"num":"6865663466964728"},
    "billing_address":{"id":1942,"name":"Pierce Cronin","street":"3487 Leuschke Stravenue Apt. 401","city":"Lake Julestown","state":"HI",
    "country":"USA","zip":"71631-9647"},"shipping_address":{"id":1941,"name":"Pierce Cronin","street":"8080 Maryjane Drive Suite 917",
    "city":"South Vestashire","state":"MI","country":"USA","zip":"44686-1141"},"items":[{"id":8490,"order_id":971,"seller_id":4,"quantity":3,
    "listed_price":51.31},{"id":8491,"order_id":971,"seller_id":4,"quantity":9,"listed_price":56.84}],"total_price":665.49}}`;
    
    return axios.post('http://127.0.0.1:3000/order', JSON.parse(in_flight))
    .then(res => {
      expect(res.status).to.equal(200);
    })
    .catch(err => {
      console.log("Error: ", err)
      expect(false).to.equal(true);
    })
  })

  it('Should accept the in-flight object structure from Inventory API', function() {
    var in_flight = `[{"id":8490,"seller_id":4,"wholesale_price":199,"quantity":100,"order_id":971},{"id":8491,"seller_id":4,"wholesale_price":120,"quantity":100,"order_id":971}]`;
    
    return axios.post('http://127.0.0.1:3000/inventoryinfo', JSON.parse(in_flight))
    .then(res => {
      expect(res.status).to.equal(200)
      var confirmQuery = `SELECT wholesale_price FROM item WHERE order_id = 971`
      return db.connection.queryAsync(confirmQuery)
        .then(result => {
          expect(result[0].wholesale_price).to.equal(199.00);
          expect(result[1].wholesale_price).to.equal(120.00);
        })
    })
    .catch(err => {
      console.log("Error: ", err);
      expect(false).to.equal(true);
    })
  })

  it('Should accept the in-flight object structure from Analytics API', function() {
    var in_flight = `{"order":{"order_id":971,"fraud_score":75}}`;
    
    return axios.post('http://127.0.0.1:3000/fraudscore', JSON.parse(in_flight))
    .then(res => {
      expect(res.status).to.equal(200);
      var confirmQuery = `SELECT fraud_score FROM user_order WHERE order_id = 971`;
      return db.connection.queryAsync(confirmQuery)
        .then(result => {
          expect(result[0].fraud_score).to.equal(75);
        })
    })
    .catch(err => {
      console.log("Error: ", err);
      expect(false).to.equal(true);
    })
  })

})




