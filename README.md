# Oblako Analytics - eCommerce Fraud Detection

This is the "Orders" microservice for eCommerce clone Oblako Analytics. An in-depth description of the full system can be found here: https://docs.google.com/document/d/1F5gqUwwT7v-rDM2xBL9jbakSkcOj33VtvwJankXhbHY/edit?usp=sharing

The purpose of this microservice is to process all orders received from Users by (1) determining whether Inventory can fulfill the quantity purchased and (2) ensuring the fraud score provided by Analytics is below threshold.


## Usage

- On the command line, perform the following from the project’s root directory:
    - “mysql.server start” (starts mysql server)
    - “mysql -u root < schema.sql” (creates database “orders_API” under user “root” with no password)
    - “npm install” (installs node module dependencies)
    - In the "orders/messagebus/config" directory, replace all "config-example.json" and "config-example.js" files with config.json and config.js files. Ensure that all Amazon SQS keys and urls have been entered.
    - “npm start” (starts server at localhost:3000)


Note: The Inventory, User Activity, and Analytics microservices (found at https://github.com/Oblako4) must also be installed to run this microservice.

## Requirements

- MySQL v5.7 
- Node (v6.4.0 or later)


