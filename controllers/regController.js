const connection = require('../DataBase/connection'); // Import the connection module 

//=========================================================================================
function registerUser(req, res) {
    const {
      Gender,
      FirstName,
      LastName,
      Age,
      SSN,
      ParentName,
      ParentNumber,
      ParentEmail,
      Username,
      Password,
    } = req.body;
  
    // Check if SSN or Username already exist
    const checkDuplicateQuery = `SELECT * FROM registration WHERE Username = ? OR Password = ?`;
    connection.query(checkDuplicateQuery, [Username, Password], (checkDuplicateErr, duplicateResult) => {
      if (checkDuplicateErr) {
        console.error("Error checking for existing SSN and Username:", checkDuplicateErr);
        res.status(500).json({ error: "Internal Server Error, Check if password and Username exist in registration table" });
        return;
      }
  
      if (duplicateResult.length > 0) {
        // If SSN or Username already exists, handle the error
        const existingPassword = duplicateResult.find(user => user.Password === Password);
        const existingUsername = duplicateResult.find(user => user.Username === Username);
  
        if (existingPassword) {
          console.log("Password already exists");
          res.status(400).json({ error: "Password already exists" });
          return;
        }
  
        if (existingUsername) {
          console.log("Username already exists");
          res.status(400).json({ error: "Username already exists" });
          return;
        }
      }
  
      // Insert into registration table
      const insertUserQuery = `INSERT INTO registration (Gender, FirstName, LastName, Age, SSN, ParentName, ParentNumber, ParentEmail, Username, Password) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      connection.query(insertUserQuery, [Gender, FirstName, LastName, Age, SSN, ParentName, ParentNumber, ParentEmail, Username, Password], (insertErr, insertResult) => {
        if (insertErr) {
          console.error("Error creating user:", insertErr);
          res.status(500).json({ error: "Internal Server Error, Failed to register user" });
          return;
        }
  
        console.log("New user registered with UserID:", insertResult.insertId);
        res.status(201).json({ message: "User registered successfully" });
      });
    });
  }
//===============================================================================================
function loginUser(req, res) {
  const { Username, Password } = req.body;

  // Check if Username exists
  const checkUserQuery = `SELECT * FROM registration WHERE Username = ?`;
  connection.query(checkUserQuery, [Username], (checkUserErr, userResult) => {
    if (checkUserErr) {
      console.error("Error checking for existing Username:", checkUserErr);
      res.status(500).json({ error: "Internal Server Error, Check if Username exists in registration table" });
      return;
    }

    if (userResult.length === 0) {
      // If Username does not exist, handle the error
      console.log("Username does not exist");
      res.status(400).json({ error: "Invalid Username or Password" });
      return;
    }

    const user = userResult[0];

    // Check if Password matches
    if (Password !== user.Password) {
      console.log("Invalid Password");
      res.status(400).json({ error: "Invalid Username or Password" });
      return;
    }

    // Login successful
    console.log("User logged in:", user.Username);
    console.log("ID logged in:", user.PatientID);

    // Send back the PatientID along with the message
    res.status(200).json({ message: "Login successful", user });
  });
}


//===============================================================================================
function getPatientbyID(req, res) {
  const { PatientID } = req.query; // Using query parameters instead of req.body

  // Check if PatientID exists in the database
  const sql_query = 'SELECT * FROM registration WHERE PatientID = ?';
  connection.query(sql_query, [PatientID], (err, result) => {
      if (err) {
          console.error("Error fetching patient data:", err);
          res.status(500).json({ error: "Internal Server Error" });
          return;
      }
      if (result.length === 0) {
          res.status(404).json({ message: `No patients found for patient with ID ${PatientID}.` });
      } else {
          const patients = processQueryResult(result);
          res.status(200).json(patients);
      }
  });
}

//==========================================================================================================================
function processQueryResult(result) {          //Function to process the query result and build the record map
  const patientsMap = {};

  result.forEach((row) => {
    const { PatientID, Gender,
      FirstName,
      LastName,
      Age,
      SSN,
      ParentName,
      ParentNumber,
      ParentEmail,
      Username,
      Password, } = row;

    if (!patientsMap[PatientID]) {
      patientsMap[PatientID] = {
        PatientID,
        Gender: row.Gender,
        FirstName: row.FirstName,
        LastName: row.LastName,
        Age: row.Age,
        SSN: row.SSN,
        ParentName: row.ParentName,
        ParentNumber: row.ParentNumber,
        ParentEmail: row.ParentEmail,
        Username: row.Username,
        Password: row.Password,
      };
    }
  });

  return Object.values(patientsMap);
}


//===========================================================================
function getPatientAndEMR(req, res) {
  const patientID = req.params.patientID;

  // Fetch patient registration and EMR data
  const query = `
    SELECT 
    r.PatientID,
    r.FirstName,
    r.LastName,
    r.Age,
    rec.Weight,
    rec.Length,
    i.IllnessDescription,
    mt.TestDescription,
    o.OperationName,
    d.DName,
    d.DDuration,
    d.DDose,
    d.Notes
  FROM 
    Registration r
  LEFT JOIN 
    Record rec ON r.PatientID = rec.PatientID
  LEFT JOIN 
    Illnesses i ON r.PatientID = i.PatientID
  LEFT JOIN 
    MedicalTests mt ON r.PatientID = mt.PatientID
  LEFT JOIN 
    Operations o ON r.PatientID = o.PatientID
  LEFT JOIN 
    Drug d ON r.PatientID = d.PatientID
  WHERE 
    r.PatientID = ?;`;

  connection.query(query, [patientID], (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Process and format the results
    const patientData = processPatientAndEMRData(results);
    res.status(200).json(patientData);
  });
}
//=====================================================================
function processPatientAndEMRData(data) {
  const patientAndEMRData = {
    registration: [],
    emr: [],
    drugs: [],
    illness: [],
    tests: [],
    operation: []
  };

  // Helper function to remove duplicates from an array of objects based on a key
  function removeDuplicates(array, key) {
    return array.filter((item, index, self) =>
      index === self.findIndex(obj => obj[key] === item[key])
    );
  }

  // Process data
  data.forEach(row => {
    const registrationData = {
      PatientID: row.PatientID,
      FirstName: row.FirstName,
      LastName: row.LastName,
      Age: row.Age
    };

    const emrData = {
      PatientID: row.PatientID,
      Weight: row.Weight,
      Height: row.Length
    };

    // Push registration and emr data
    patientAndEMRData.registration.push(registrationData);
    patientAndEMRData.emr.push(emrData);

    // Push drugs data (as an array)
    if (row.DName) {
      patientAndEMRData.drugs.push({ 
        DName: row.DName,
        DDuration: row.DDuration,
        DDose: row.DDose,
        Notes: row.Notes
      });
    }

    // Push illness data (as an array)
    if (row.IllnessDescription) {
      patientAndEMRData.illness.push({ IllnessDescription: row.IllnessDescription });
    }

    // Push tests data (as an array)
    if (row.TestDescription) {
      patientAndEMRData.tests.push({ TestDescription: row.TestDescription });
    }

    // Push operations data (as an array)
    if (row.OperationName) {
      patientAndEMRData.operation.push({ OperationName: row.OperationName });
    }
  });

  // Remove duplicates from drugs, illness, tests, and operations arrays
  patientAndEMRData.drugs = removeDuplicates(patientAndEMRData.drugs, 'DName');
  patientAndEMRData.drugs = removeDuplicates(patientAndEMRData.drugs, 'DDuration');
  patientAndEMRData.drugs = removeDuplicates(patientAndEMRData.drugs, 'DDose');
  patientAndEMRData.drugs = removeDuplicates(patientAndEMRData.drugs, 'Notes');
  patientAndEMRData.illness = removeDuplicates(patientAndEMRData.illness, 'IllnessDescription');
  patientAndEMRData.tests = removeDuplicates(patientAndEMRData.tests, 'TestDescription');
  patientAndEMRData.operation = removeDuplicates(patientAndEMRData.operation, 'OperationName');

  return patientAndEMRData;
}

function getPatientrecord(req, res) {
  const patientID = req.params.patientID;

  // Fetch patient registration and EMR data
  const query = `
    SELECT 
    r.PatientID,
    v.BloodPressure,
    v.RespirationRate,
    v.HeartRate,
    v.DiabeticTest,
    v.SPO2,
    ra.RecommendedActionDescription,
    p.Diagnosis,
    p.ExtraNotes
  FROM 
    Registration r
  LEFT JOIN 
    vital v ON r.PatientID = v.PatientID
  LEFT JOIN 
   Prescription p ON r.PatientID = p.PatientID
  LEFT JOIN 
    RecommendedAction ra ON r.PatientID = ra.PatientID
  WHERE 
    r.PatientID = ?;`;

  connection.query(query, [patientID], (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Process and format the results
    const patientData = processPatientrecord(results);
    res.status(200).json(patientData);
  });
}
//=====================================================================
function processPatientrecord(data) {
  const patientRecord = {
    vital: [],
    RecommendedAction: [],
    Prescription: []
  };

  // Helper function to remove duplicates from an array of objects based on a key
  function removeDuplicates(array, key) {
    return array.filter((item, index, self) =>
      index === self.findIndex(obj => obj[key] === item[key])
    );
  }

  // Process data
  data.forEach(row => {

    

   
    patientRecord.vital.push({
      BloodPressure: row.BloodPressure,
      RespirationRate: row.RespirationRate,
      HeartRate: row.HeartRate,
      DiabeticTest: row.DiabeticTest,
      SPO2: row.SPO2
    });

    if (row.RecommendedActionDescription) {
      patientRecord.RecommendedAction.push({ 
        RecommendedActionDescription: row.RecommendedActionDescription
      });
    }

  
      patientRecord.Prescription.push({ Diagnosis: row.Diagnosis,
        ExtraNotes: row.ExtraNotes
       });
    

  });

  // Remove duplicates from drugs, illness, tests, and operations arrays
  patientRecord.vital = removeDuplicates( patientRecord.vital, 'BloodPressure');
   patientRecord.vital = removeDuplicates( patientRecord.vital, 'RespirationRate');
   patientRecord.vital = removeDuplicates( patientRecord.vital, 'HeartRate');
   patientRecord.vital = removeDuplicates( patientRecord.vital, 'DiabeticTest');
   patientRecord.vital = removeDuplicates( patientRecord.vital, 'SPO2');
  patientRecord.RecommendedAction = removeDuplicates(patientRecord.RecommendedAction, 'RecommendedActionDescription');
  patientRecord.Prescription = removeDuplicates(patientRecord.Prescription, 'Diagnosis');
  patientRecord.Prescription = removeDuplicates(patientRecord.Prescription, 'ExtraNotes');

  return patientRecord;
}

//====================================================================================================
function updatePatientByID(req, res) {
  
  // Extract updated information from the request body
  const { PatientID, FirstName, LastName, Age, SSN, ParentName, ParentNumber, ParentEmail, Username, Password, pdfFile } = req.body;

  // Check if PatientID exists in the database
  const sql_query = 'SELECT * FROM registration WHERE PatientID = ?';
  connection.query(sql_query, [PatientID], (err, result) => {
      if (err) {
          console.error("Error fetching patient data:", err);
          res.status(500).json({ error: "Internal Server Error" });
          return;
      }
      if (result.length === 0) {
          res.status(404).json({ message: `No patients found for patient with ID ${PatientID}.` });
      } else {
          // Execute the update query
          const update_query = `
            UPDATE registration
            SET FirstName = ?, LastName = ?, Age = ?, SSN = ?, ParentName = ?, ParentNumber = ?, ParentEmail = ?, Username = ?, Password = ?, pdfFile = ?
            WHERE PatientID = ?`;
          connection.query(update_query, [FirstName, LastName, Age, SSN, ParentName, ParentNumber, ParentEmail, Username, Password, pdfFile, PatientID], (err, updateResult) => {
              if (err) {
                  console.error("Error updating patient data:", err);
                  res.status(500).json({ error: "Internal Server Error" });
                  return;
              }
              console.error(`Patient with ID ${PatientID} updated successfully.`);
              res.status(200).json({ message: `Patient with ID ${PatientID} updated successfully.` });
          });
      }
  });
}
//=================================================================================================================
module.exports = {
    registerUser,
    loginUser,
    getPatientbyID,
    getPatientAndEMR,
    getPatientrecord,
    updatePatientByID,
};