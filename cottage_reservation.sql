create database cottage_reservation;
use cottage_reservation;

CREATE TABLE customer (
    c_id INT AUTO_INCREMENT PRIMARY KEY,
    c_full_name VARCHAR(50),
    c_gmail VARCHAR(100) UNIQUE,
    c_password VARCHAR(255),
    created_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SELECT * FROM  customer;

ALTER TABLE customer
ADD COLUMN otp VARCHAR(6) NULL,
ADD COLUMN otp_expiry DATETIME NULL;
