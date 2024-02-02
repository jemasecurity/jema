const env = require('dotenv').config();
console.log(env.parsed);

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(__dirname));

// Move the pool variable outside the connection callback
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'buuedht0tchqebrkwamg-mysql.services.clever-cloud.com',
  user: process.env.DB_USER || 'u1fbdrbtv5dvzads',
  password: process.env.DB_PASSWORD || '9lFiBkpEzHV9RwLkdKx',
  database: process.env.DB_NAME || 'buuedht0tchqebrkwamg',
  port: process.env.DB_PORT || 21667,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  promise: true, // Enables the promise-based API
  connectTimeout: 15000, // milliseconds
  acquireTimeout: 15000, // milliseconds
});

// Handle connection errors
pool.promise().getConnection().then((connection) => {
  console.log('Connected to the database');
  connection.release(); // Release the initial connection

  app.use(express.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  // User Registration
  app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    const values = [username, email, password];

    try {
      const [result] = await connection.query(sql, values);
      console.log('User registered:', username);
      res.status(200).send('User registered successfully.');
    } catch (error) {
      console.error('Database insertion error:', error);
      res.status(500).send('Error registering user.');
    } finally {
      connection.release(); // Release the connection after the query
    }
  });

  app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    // Query the database to check if the user exists and the password is correct
    const query = "SELECT * FROM users WHERE username = ?";

    try {
      const [results] = await pool.promise().query(query, [username]);

      if (results.length > 0) {
        const storedPassword = results[0].password;
        if (password === storedPassword) {
          res.status(200).json({ success: true, message: "Login successful", username: results[0].username });
        } else {
          res.status(401).json({ success: false, message: "Login failed. Passwords do not match." });
        }
      } else {
        res.status(401).json({ success: false, message: "Login failed. User not found." });
      }
    } catch (err) {
      console.error("Error in database query: " + err);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });

  // Function to generate a random 10-character alphanumeric code
  function generateTrackingCode() {
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let code = '';
    for (let i = 0; i < 10; i++) {
      const randomIndex = crypto.randomInt(0, characters.length);
      code += characters.charAt(randomIndex);
    }
    return code;
  }

  // Submit Quote
  app.post('/submit-quote', async (req, res) => {
    const quoteData = req.body; // Get quote details from the request

    // Insert the quote details into the database
    const insertQuery = 'INSERT INTO freight_details (senders_name, Origin, origin_state, origin_zip_code, recievers_name, recievers_phone_number, recievers_email, destination, destination_state, destination_zip_code, package_name, package_type, package_weight, package_demension, package_number, tracking_code, package_password, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

    // Generate a unique 10-character tracking code
    const trackingCode = generateTrackingCode();

    try {
      const [result] = await pool.promise().query(insertQuery, [quoteData.senders_name, quoteData.origin, quoteData.origin_state, quoteData.origin_zip_code, quoteData.recievers_name, quoteData.recievers_phone_number, quoteData.recievers_email, quoteData.destination, quoteData.destination_state, quoteData.destination_zip_code, quoteData.package_name, quoteData.package_type, quoteData.package_weight, quoteData.package_demension, quoteData.package_number, trackingCode, quoteData.package_password, quoteData.latitude, quoteData.longitude]);
      console.log('Added new quote');
      res.json({ success: true, trackingCode });
    } catch (error) {
      console.error('Error inserting quote:', error);
      res.json({ success: false, message: 'Failed to submit quote' });
    }
  });

  // Retrieve Quote
  app.post('/retrieve-quote', async (req, res) => {
    const { tracking_code, package_password } = req.body; // Get tracking code and package_password

    // Query the database to retrieve the quote details
    const quoteQuery = 'SELECT * FROM freight_details WHERE tracking_code = ? AND package_password = ?';

    try {
      const [quoteResults] = await pool.promise().query(quoteQuery, [tracking_code, package_password]);

      if (quoteResults.length === 0) {
        return res.json({ success: false, message: 'Quote not found or password incorrect' });
      }

      const quote = quoteResults[0];
      return res.json({ success: true, quote });
    } catch (error) {
      console.error('Error retrieving quote:', error);
      return res.json({ success: false, message: 'Failed to retrieve quote' });
    }
  });

  // Route to display an existing quote for editing
  app.get('/quote/:trackingCode/edit', async (req, res) => {
    const trackingCode = req.params.trackingCode;
    try {
      // Fetch quote details from the database based on trackingCode
      const quote = await getQuoteByTrackingCode(trackingCode);
      // Render a form for editing, with current details filled in
      res.render('edit_quote', { quote });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  // Route to handle quote update
  app.post('/quote/:trackingCode/edit', async (req, res) => {
    const trackingCode = req.params.trackingCode;
    try {
      // Update the quote details in the database based on trackingCode
      await updateQuoteByTrackingCode(trackingCode, req.body);
      // Redirect to a page displaying the updated quote
      res.redirect('/dashboard.html'); // Change this to the actual route for your dashboard
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  async function getQuoteByTrackingCode(trackingCode) {
    const connection = await pool.promise().getConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM freight_details WHERE tracking_code = ?', [trackingCode]);
      return rows[0];
    } finally {
      connection.release();
    }
  }

  async function updateQuoteByTrackingCode(trackingCode, { latitude, longitude }) {
    const connection = await pool.promise().getConnection();
    try {
      await connection.query(
        'UPDATE freight_details SET latitude = ?, longitude = ? WHERE tracking_code = ?',
        [latitude, longitude, trackingCode]
      );
    } finally {
      connection.release();
    }
  }

  // Add this route to your server-side code
  app.post('/retrieve-quote', async (req, res) => {
    const trackingCode = req.body.trackingCode;

    // Query the database to retrieve the quote details
    const quoteQuery = 'SELECT * FROM freight_details WHERE tracking_code = ?';

    try {
      const [quoteResults] = await pool.promise().query(quoteQuery, [trackingCode]);

      if (quoteResults.length === 0) {
        return res.json({ success: false, message: 'Quote not found' });
      }

      const quote = quoteResults[0];
      // Render a page with the retrieved quote details
      res.render('edit_retrieved_quote', { quote });
    } catch (error) {
      console.error('Error retrieving quote:', error);
      return res.json({ success: false, message: 'Failed to retrieve quote' });
    }
  });

  // Start the server
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}).catch((err) => {
  console.error('Error connecting to the database:', err);
  process.exit(1); // Terminate the application on connection error
});

// Function to generate a random 10-character alphanumeric code
function generateTrackingCode() {
  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let code = '';
  for (let i = 0; i < 10; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    code += characters.charAt(randomIndex);
  }
  return code;
}
