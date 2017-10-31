var mysql = require('mysql');
var request = require('request'); 
var expect = require('chai').expect;
const connection = require('../database/test.js').connection;


describe('Database schema tests', function() {
  it('Should insert orders into the database', function(done) {

  });
  
  it('Should insert purchase date into order_history table', function(done) {

  });

  it('Columns fraud_score, wholesale_total, and std_dev_from_aov should initially be NULL', function(done) {

  });

});