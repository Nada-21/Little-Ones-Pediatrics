const connection = require('../DataBase/connection'); // Import the connection module 

//=========================================================================================================================
function getDoctor(req, res) {
  const sql_query = 'SELECT * FROM Doctors'; 
  connection.query(sql_query, (err, result) => {
    if (err) {
      console.error('Error fetching doctors:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.status(200).json(result);
  });
}
//=========================================================================================================================
function getDoctorbyusername(req, res) {
  const { Username, Password } = req.body;

  // Check if username exists in the database
  const sql_query = 'SELECT * FROM Doctors WHERE Username = ?';
  connection.query(sql_query, [Username], async (err, result) => {
      if (err) {
          console.error('Error fetching doctor:', err);
          return res.status(500).json({ error: 'Internal server error' });
      }

      if (result.length === 0) {
          // Username not found
          console.log('Username not found:', Username);
          return res.status(401).send('Invalid username');
      }
      const doctor = result[0];

      if (Password !== doctor.Password) {
          // Incorrect password
          console.log('Incorrect password for username:', Username);
          return res.status(401).send('Wrong password');
      }

      // Login successful
    console.log("Doctor logged in:", Username);
    res.status(200).json({ message: "Login successful" , Username});
  });
}

//=========================================================================================================================
module.exports = {
  getDoctor,
  getDoctorbyusername
};
