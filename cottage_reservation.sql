create database cottage_reservation;
use cottage_reservation;

CREATE TABLE admin (
    a_id INT AUTO_INCREMENT PRIMARY KEY,
    a_full_name VARCHAR(50),
    a_gmail VARCHAR(100) UNIQUE,
    a_password VARCHAR(255),
    created_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

ALTER TABLE customer
ADD COLUMN profile_image VARCHAR(255) NULL;

ALTER TABLE customer
ADD COLUMN is_blocked TINYINT(1) DEFAULT 0;

CREATE TABLE customer_message (
    msg_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NULL,        
    email VARCHAR(100) NOT NULL,        
    message TEXT NOT NULL,             
    source_page ENUM('landing', 'home') NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

SELECT * FROM  customer_message;

CREATE TABLE cottages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  capacity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE cottages ADD COLUMN likes INT DEFAULT 0;
ALTER TABLE cottages ADD COLUMN availability ENUM('Available', 'Occupied') DEFAULT 'Available';
SELECT * FROM  cottages;

CREATE TABLE cottage_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  cottage_id INT NOT NULL,
  UNIQUE KEY unique_like (customer_id, cottage_id)
);
SELECT * FROM cottage_likes;


CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  cottage_id INT NOT NULL,
  status ENUM('pending','paid','cancelled') DEFAULT 'pending',
  stripe_session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES customer(c_id),
  FOREIGN KEY (cottage_id) REFERENCES cottages(id)
);
ALTER TABLE bookings 
ADD Column payment_method VARCHAR(50),
MODIFY COLUMN status ENUM('pending', 'paid', 'cancelled', 'confirmed');

SELECT * FROM bookings;


