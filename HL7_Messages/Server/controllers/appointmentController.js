const connection = require('../DataBase/connection'); // Import the connection module 

//========================================== Create new appointment  ===============================================
async function createAppointment(req, res) {
    const {Username, DoctorName,Type, Date, Slot } = req.body;
    console.log(Username);

    try {
        // Check if the appointment already exists
        const appointmentExists = await checkAppointmentExists(DoctorName, Date, Slot);
        if (appointmentExists) {
            return res.status(400).json({ message: "This appointment is not available as it is booked before." });
        }

        // Insert the appointment into the database
        const insertedAppointmentID= await insertAppointment(Username, DoctorName, Type, Date, Slot);

        console.log("New appointment is booked successfully");
        res.status(201).json({ message: "New appointment is booked successfully" , insertedAppointmentID});
    } catch (error) {
        console.error("Error creating appointment:", error);
        res.status(500).json({ message: "An error occurred while booking the appointment." });
    }
}

async function checkAppointmentExists(DoctorName, Date, Slot) {
    const sql_query_CheckAppointment = `SELECT COUNT(*) AS count FROM appointment WHERE DoctorName = ? AND Date = ? AND Slot = ?`;
    const [result] = await connection.promise().query(sql_query_CheckAppointment, [DoctorName, Date, Slot]);
    return result[0].count > 0;
}

  //================================================================================================
  async function insertAppointment(Username, DoctorName,Type, Date, Slot) {
    try {
        // Get patientID from registration table by the given Username
        const [patientResult] = await connection.promise().query(
            'SELECT PatientID FROM registration WHERE Username = ?', [Username]
        );
        const PatientID = patientResult[0].PatientID;

        // Get DoctorID from doctors table by the given DoctorName
        const [doctorResult] = await connection.promise().query(
            'SELECT doctors.DoctorID , doctors.Username FROM doctors WHERE DoctorName = ?', [DoctorName]
        );
        const DoctorID = doctorResult[0].DoctorID;
        const doctorUsername = doctorResult[0].Username;


        // Insert into appointment table
        const sql_query_Appointment = 'INSERT INTO appointment (DoctorName,Type, Date, Slot, DoctorID, PatientID, DoctorUsername) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const [appointmentResult] = await connection.promise().query(sql_query_Appointment, [DoctorName,Type, Date, Slot, DoctorID, PatientID, doctorUsername]);
        // Get the auto-incremented AppointmentID from the inserted record
        const insertedAppointmentID = appointmentResult.insertId;
        console.log('Appointment inserted successfully');
        return insertedAppointmentID;

    } catch (error) {
        console.error('Error inserting appointment:', error);
        throw error;
    }
}

  // //================================================================================================
  // function getAllAppointments(req, res) {  //Get all appointment
  //   const sql_query = generateAppointmentQuery("","");
  //   connection.query(sql_query, (err, result) => {
  //     if (err) throw err;
  //     if (result.length === 0) {
  //       res.status(404).json({ message: "No appointment found in appointments list" });
  //     } 
  //     else {
  //       const appointmentArray = processQueryResult(result);
  //       res.json(appointmentArray);
  //     }
  //   });
  // }
  

  // //================================================================================================
  // function getAppointmentByPatientID (req, res){  // Get Appointment By PatientID
  //   const PatientID = req.params.PatientID;
  //   const sql_query = generateAppointmentQuery("",` AND appointment.PatientID = ${PatientID}`);
  //   connection.query(sql_query, [PatientID], (err, result) => {
  //     if (err) throw err;
  //     if (result.length === 0) {
  //       res.status(404).json({ message: `Appointment with ID ${PatientID} not found.` });
  //     } 
  //     else {
  //       const appointmentArray = processQueryResult(result);
  //       res.json(appointmentArray);
  //     }
  //   });
  // }

  //================================================================================================
  function getAppointmentByDoctorUsername(req, res){  // Get Appointment By DoctorUsername
    const DoctorUsername = req.params.doctorUsername;
    console.log(DoctorUsername);
    const sql_query = generateAppointmentQuery(` LEFT JOIN registration ON appointment.PatientID = registration.PatientID`,` AND appointment.DoctorUsername = ?`);
    connection.query(sql_query, [DoctorUsername], (err, result) => {
      if (err) throw err;
      if (result.length === 0) {
        res.status(404).json({ message: `Appointments with DoctorUsername ${DoctorUsername} not found.` });
      } 
      else {
        const appointmentArray = processQueryResult(result);
        console.log(appointmentArray);
        res.json(appointmentArray);
      }
    });
  }

    //===============================================================================================
    function generateAppointmentQuery(joinConditions, whereConditions) {   // Function to generate the common SQL query for retrieving appointments
        const sql_query = `
        SELECT appointment.AppointmentID, appointment.Type, appointment.Date, appointment.Slot, registration.FirstName, registration.ParentNumber
        FROM appointment
        ${joinConditions}
        WHERE appointment.AppointmentID IS NOT NULL ${whereConditions}` ;
    
        return sql_query;
    }

    //===============================================================================================
function processQueryResult(result) {          //Function to process the query result and build the Appointment map
  const appointmentList = [];

  // Iterate through each row in the result
  result.forEach((row) => {
    const {AppointmentID} = row;
      // Create an appointment object for each row
      const appointment = {
          AppointmentID,
          FirstName: row.FirstName,
          ParentNumber: row.ParentNumber,
          Type: row.Type,
          Date: row.Date,
          Slot: row.Slot
      };

      // Push the appointment object into the appointmentList array
      // Check if AppointmentID is not null and not already in the array
      if (AppointmentID !== null ) {
      appointmentList.push(appointment);
    }
  });

  return appointmentList;
}

// Controller function to delete an appointment by appointment ID
async function deleteappointmentByappointmentId(req, res) {
  // Extract the appointment ID from the request parameters
  const appointmentId = req.params.appointmentId;

  try {
      // SQL query to delete appointment by appointment ID
      const sql_query_deleteAppointment = 'DELETE FROM appointment WHERE AppointmentID = ?';

      // Execute the SQL query
      const [result] = await connection.promise().query(sql_query_deleteAppointment, [appointmentId]);

      // Check if the appointment was successfully deleted
      if (result.affectedRows > 0) {
          console.log(`Appointment with ID ${appointmentId} has been deleted successfully.`);
          res.status(200).json({ message: `Appointment with ID ${appointmentId} has been deleted successfully.` });
      } else {
          console.log(`No appointment found with ID ${appointmentId}.`);
          res.status(404).json({ message: `No appointment found with ID ${appointmentId}.` });
      }
  } catch (error) {
      console.error('Error deleting appointment:', error);
      res.status(500).json({ error: 'An error occurred while deleting the appointment.' });
  }
}

  
//===============================================================================================
module.exports = {
    createAppointment,
    // getAllAppointments,
    getAppointmentByDoctorUsername,
    // updateAppointmentByPatientID,
    deleteappointmentByappointmentId
  };