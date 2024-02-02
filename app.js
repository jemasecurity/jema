require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const mysql = require('mysql2')
const path = require('path');
const fs = require('fs');
const multer = require('multer');


const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: true,
//   })
// );

app.use(express.static(__dirname));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'b9nov1tsxqwwxieds5mu',
  port: 21088,
  insecureAuth: true,
});

// const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: 'u530321172_jemasecuritydb',
//   insecureAuth: true,
// });

// app.get('/', (req, res) => {
//   const isLoggedIn = req.session.isLoggedIn || false;
//   res.render('index', { isLoggedIn }); // Render the HTML file and pass data
// });


app.get('/', (req, res) => {
  res.render('index');
});


pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  console.log('Connected to MySQL');

  // Perform database operations here

 // app.js

// ... (other imports and configurations)

  app.post('/register', async (req, res) => {
    const { email, username, password } = req.body;

    // Check if the email is already in use
    const emailCheckQuery = 'SELECT * FROM users WHERE email = ?';

    pool.query(emailCheckQuery, [email], (emailCheckError, emailCheckResults) => {
      if (emailCheckError) {
        console.error('Error checking email:', emailCheckError);
        return res.status(500).send('Internal Server Error');
      }

      if (emailCheckResults.length > 0) {
        // Email is already in use
        return res.status(400).send('Email address is already in use');
      }

      // Hash the password before storing it in the database
      bcrypt.hash(password, 10, (hashError, hashedPassword) => {
        if (hashError) {
          console.error('Error hashing password:', hashError);
          return res.status(500).send('Internal Server Error');
        }

        // Store user information in the database
        const registerQuery = 'INSERT INTO users (email, username, password) VALUES (?, ?, ?)';

        pool.query(registerQuery, [email, username, hashedPassword], (registerError, registerResults) => {
          if (registerError) {
            if (registerError.code === 'ER_DUP_ENTRY') {
              // Duplicate entry (username) error
              return res.status(400).send('Username is already in use');
            }

            console.error('Error registering user:', registerError);
            return res.status(500).send('Internal Server Error');
          }

          res.redirect('/login.html');
        });
      });
    });
  });

  app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';

    pool.query(query, [email], (error, results) => {
      if (error) {
        console.error('Error fetching user:', error);
        return res.status(500).send('Internal Server Error');
      }

      if (results.length === 0) {
        return res.status(401).send('Invalid email or password');
      }

      const user = results[0];

      bcrypt.compare(password, user.password, (bcryptError, result) => {
        if (bcryptError) {
          console.error('Error comparing passwords:', bcryptError);
          return res.status(500).send('Internal Server Error');
        }

        if (!result) {
          return res.status(401).send('Invalid email or password');
        }

        res.redirect('/dashboard.html');
      });
    });
  });

  app.get('/logout', (req, res) => {
    req.session.isLoggedIn = false;
    res.redirect('/index.html');
  });



  app.post('/submit-recruitment-forms', (req, res) => {
    const {
      firstname,
      middlename,
      othernames,
      country,
      state,
      localgovernment,
      stateofresidence,
      city,
      dateofbirth,
      gender,
      maritalstatus,
      occupation,
      currentworkplace,
      phonenumber,
      email,
      nextofkin,
      relationship,
      kinsphonenumber,
      kinsemail,
    } = req.body;

    console.log('Received form data:', req.body);
  
    const query = `
      INSERT INTO recruitment_forms (
        firstname,
        middlename,
        othernames,
        country,
        state,
        localgovernment,
        stateofresidence,
        city,
        dateofbirth,
        gender,
        maritalstatus,
        occupation,
        currentworkplace,
        phonenumber,
        email,
        nextofkin,
        relationship,
        kinsphonenumber,
        kinsemail
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
  
    const values = [
      firstname,
      middlename,
      othernames,
      country,
      state,
      localgovernment,
      stateofresidence,
      city,
      dateofbirth,
      gender,
      maritalstatus,
      occupation,
      currentworkplace,
      phonenumber,
      email,
      nextofkin,
      relationship,
      kinsphonenumber,
      kinsemail,
    ];
  
    pool.query(query, values, (error, results) => {
      if (error) {
        console.error('Error submitting recruitment form:', error);
        console.error('Received form data:', req.body);
        console.error('SQL Query:', query);
        console.error('SQL Values:', values);

        // return res.status(500).send('Internal Server Error');
        return res.status(500).json({ error: 'Internal Server Error', details: error });
        
      }
  
      // Move the redirect outside of the query callback
      res.sendFile(path.join(__dirname, 'dashboard.html'));
    });
  });
  


  process.on('SIGINT', () => {
    console.log('Server is shutting down...');
    connection.release();
    process.exit();
  });
});