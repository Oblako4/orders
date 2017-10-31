-- ---
-- Globals
-- ---

-- SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
-- SET FOREIGN_KEY_CHECKS=0;

-- ---
-- Table 'order'
-- 
-- ---
DROP DATABASE IF EXISTS orders_API_test;
CREATE DATABASE orders_API_test;
USE orders_API_test;

DROP TABLE IF EXISTS user_order;
    
CREATE TABLE user_order (
  id INTEGER NOT NULL AUTO_INCREMENT,
  order_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  billing_name VARCHAR(50) NOT NULL,
  billing_street VARCHAR(100) NOT NULL,
  billing_city VARCHAR(50) NOT NULL,
  billing_state VARCHAR(50) NOT NULL,
  billing_ZIP VARCHAR(20) NOT NULL,
  billing_country VARCHAR(50) NOT NULL,
  shipping_name VARCHAR(50) NOT NULL,
  shipping_street VARCHAR(100) NOT NULL,
  shipping_city VARCHAR(50) NOT NULL,
  shipping_state VARCHAR(50) NOT NULL,
  shipping_ZIP VARCHAR(20) NOT NULL,
  shipping_country VARCHAR(50) NOT NULL,
  total_price DECIMAL(7, 2) NOT NULL,
  card_num VARCHAR(20) NOT NULL,
  fraud_score INTEGER NULL DEFAULT NULL,
  wholesale_total DECIMAL(7, 2) NULL DEFAULT NULL,
  std_dev_from_aov DECIMAL(7, 5) NULL DEFAULT NULL,
  UNIQUE(order_id),
  INDEX (order_id),
  PRIMARY KEY (id)
);

-- ---
-- Table 'item'
-- 
-- ---

DROP TABLE IF EXISTS item;
    
CREATE TABLE item (
  id INTEGER NOT NULL AUTO_INCREMENT,
  order_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  listed_price DECIMAL(7, 2) NOT NULL,
  wholesale_price DECIMAL(7, 2) NULL DEFAULT NULL,
  seller_id INTEGER NULL DEFAULT NULL,
  INDEX(order_id),
  PRIMARY KEY (id)
);

-- ---
-- Table 'order_history'
-- 
-- ---

DROP TABLE IF EXISTS order_history;
    
CREATE TABLE order_history (
  id INTEGER NOT NULL AUTO_INCREMENT,
  order_id INTEGER NULL DEFAULT NULL,
  purchased_at TIMESTAMP NOT NULL,
  declined_at TIMESTAMP NULL DEFAULT NULL,
  confirmed_at TIMESTAMP NULL DEFAULT NULL,
  processed_at TIMESTAMP NULL DEFAULT NULL,
  chargedback_at TIMESTAMP NULL DEFAULT NULL,
  INDEX(order_id),
  PRIMARY KEY (id)
);

-- ---
-- Table 'average_order_value'
-- 
-- ---

DROP TABLE IF EXISTS average_order_value;
    
CREATE TABLE average_order_value (
  id INTEGER NOT NULL AUTO_INCREMENT,
  month INTEGER NULL DEFAULT NULL,
  year INTEGER NULL DEFAULT NULL,
  avg DECIMAL (7, 2) NULL DEFAULT NULL,
  std_dev DECIMAL (7, 2) NULL DEFAULT NULL,
  PRIMARY KEY (id)
);

-- ---
-- Foreign Keys 
-- ---

ALTER TABLE item ADD FOREIGN KEY (order_id) REFERENCES user_order (order_id);
ALTER TABLE order_history ADD FOREIGN KEY (order_id) REFERENCES user_order (order_id);

-- ---
-- Table Properties
-- ---

-- ALTER TABLE `order` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
-- ALTER TABLE `item` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
-- ALTER TABLE `order_history` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
-- ALTER TABLE `average_order_value` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- ---
-- Test Data
-- ---
-- INSERT INTO user_order (order_id, user_id, billing_name, billing_street, billing_city, billing_state, billing_ZIP, billing_country, shipping_name, shipping_street, shipping_city, shipping_state, shipping_ZIP, shipping_country, total_price, card_num) 
-- VALUES (1, 1, 'Tiffany A Barth', '1 Cedar Street Apt #2', 'Worcester', 'MA', '01609-1234', 'USA', 'Tiffany A Barth', '1 Cedar Street Apt #2', 'Worcester', 'MA', 01609, 'USA', 331.99, 1234123412341234);

-- INSERT INTO item (order_id, item_id, quantity, listed_price) VALUES (1, 1, 3, 31.99);
-- INSERT INTO item (order_id, item_id, quantity, listed_price) VALUES (1, 2, 2, 200.00);
-- INSERT INTO item (order_id, item_id, quantity, listed_price) VALUES (1, 3, 1, 100.00);

-- INSERT INTO order_history (order_id, purchased_at) VALUES (1, '2017-10-25 23:42:07');

INSERT INTO average_order_value (month, year, avg, std_dev) VALUES (7, 2016, 300.00, 100.00);
INSERT INTO average_order_value (month, year, avg, std_dev) VALUES (8, 2016, 200.00, 75.00);
INSERT INTO average_order_value (month, year, avg, std_dev) VALUES (9, 2016, 300.00, 120.00);
INSERT INTO average_order_value (month, year, avg, std_dev) VALUES (10, 2016, 400.00, 150.00);

-- UPDATE item SET wholesale_price = 20.00 WHERE order_id = 1 AND item_id = 1;
-- UPDATE item SET wholesale_price = 120.00 WHERE order_id = 1 AND item_id = 2;
-- UPDATE item SET wholesale_price = 70.00 WHERE order_id = 1 AND item_id = 3;

-- UPDATE user_order SET wholesale_total = 210.00 WHERE order_id = 1;

-- UPDATE user_order SET std_dev_from_aov = -0.6398 WHERE order_id = 1;

-- UPDATE user_order SET fraud_score = 23 WHERE order_id = 1;

-- UPDATE order_history SET confirmed_at = '2017-10-25 23:53:07' WHERE order_id = 1;
-- UPDATE order_history SET declined_at = '2017-10-25 23:53:07' WHERE order_id = 1;
-- UPDATE order_history SET processed_at = '2017-10-26 1:55:07' WHERE order_id = 1;
-- UPDATE order_history SET chargedback_at = '2017-10-30 3:15:33' WHERE order_id = 1;
