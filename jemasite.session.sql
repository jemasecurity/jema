ALTER TABLE recruitment_forms
DROP COLUMN passport;






-- CREATE TABLE recruitment_forms (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   firstname VARCHAR(255) NOT NULL,
--   middlename VARCHAR(255) NOT NULL,
--   othernames VARCHAR(255) NOT NULL,
--   country VARCHAR(255) NOT NULL,
--   state VARCHAR(255) NOT NULL,
--   localgovernment VARCHAR(255) NOT NULL,
--   passport VARCHAR(255),
--   stateofresidence VARCHAR(255) NOT NULL,
--   city VARCHAR(255) NOT NULL,
--   dateofbirth VARCHAR(255) NOT NULL,
--   gender VARCHAR(255) NOT NULL,
--   maritalstatus VARCHAR(255) NOT NULL,
--   occupation VARCHAR(255) NOT NULL,
--   currentworkplace VARCHAR(255) NOT NULL,
--   phonenumber VARCHAR(20) NOT NULL,
--   email VARCHAR(20) NOT NULL,
--   nextofkin VARCHAR(255) NOT NULL,
--   relationship VARCHAR(255) NOT NULL,
--   kinsphonenumber VARCHAR(255) NOT NULL,
--   kinsemail VARCHAR(255) NOT NULL,
--   submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   UNIQUE KEY unique_user_email (email),
--   INDEX (email)
-- );









-- -- CREATE TABLE users (
-- --   id INT AUTO_INCREMENT PRIMARY KEY,
-- --   email VARCHAR(255) UNIQUE,
-- --   username VARCHAR(255) UNIQUE,
-- --   password VARCHAR(255)
-- -- );
