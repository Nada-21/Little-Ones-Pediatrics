const express = require('express');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env file

const connectionModule = require('./DataBase/connection');


const registerationRoute = require('./routes/regRouter');
const doctorsRoute = require('./routes/doctorsRouter');
const EMRRoute = require('./routes/EMRRouter');
const appointments = require('./routes/appointmentRouter');
const client = require('./routes/clientRouter');

//=================================================================================================================================

const app = express();
const PORT = 5000;

// Start server
app.listen(PORT, () => {
  console.log(`SERVER: http://localhost:${PORT}`);
  connectionModule.connect((err) => {
    if (err) throw err;
    console.log('DATABASE CONNECTED');
  });
});

// Middleware
app.use(express.json());

//=================================================================================================================================
// Routes
app.use('/', registerationRoute);
app.use('/', doctorsRoute);
app.use('/', EMRRoute);
app.use('/', appointments);
app.use('/', client);
app.use(express.static('public'));
