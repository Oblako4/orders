const mysql = require('mysql');
const Promise = require('bluebird');

const mysqlConfig = {
  host: process.env.DBSERVER || 'localhost',
  user: process.env.DBUSER || 'root',
  password: process.env.DBPASSWORD || '',
  database: process.env.DBNAME || 'orders_API'
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

module.exports = {
	connection: connection
}



