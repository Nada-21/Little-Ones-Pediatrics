const connection = require('../DataBase/connection'); // Import the connection module 
//=================================================================================================
function EmrCreate(req, res) {
    const {
      FirstName,
      PatientID,
      Weight,
      Height,
      Drugs,
      Illnesses,
      MedicalTests,
     Operations,
    } = req.body;
  
    // Check if SSN or Username already exist
    const checkDuplicateQuery = `SELECT * FROM registration WHERE PatientID = ? AND FirstName = ?`;
    connection.query(checkDuplicateQuery, [PatientID, FirstName], (checkDuplicateErr, duplicateResult) => {
      if (checkDuplicateErr) {
        console.error("Error checking for existing FirstName and ID:", checkDuplicateErr);
        res.status(500).json({ error: "Internal Server Error, Check if FirstName and ID exist in registration table" });
        return;
      }
  
      if (duplicateResult.length === 0) {
          res.status(400).json({ error: "Patient does not exist" });
          return;
        
      }

       insertRecord(PatientID, Weight,Height, res,(insertedRecord) => {
        insertDrugs(PatientID, Drugs, res,() =>{
          insertIllnesses(PatientID, Illnesses, res,() =>{
            insertMedicalTests(PatientID, MedicalTests, res,() =>{
              insertOperations(PatientID, Operations, res, () => {});
            });
          });
        });
       });

       console.log(`New EMR is created for patient with ID ${PatientID}.`);

    });
  }
//=================================================================================================
function insertRecord(PatientID, Weight, Length, res, callback) {
  const sql_query_Record = "INSERT INTO Record (PatientID, Weight, Length) VALUES ( ?, ?, ?)";
  connection.query(sql_query_Record, [PatientID,Weight, Length], (RecordErr, RecordResult) => {
    if (RecordErr) {
      console.error("Error creating Record:", RecordErr);
      res.status(500).json({ error: "Internal Server Error, Check if PatientID exists" });
      return;
    }
    const insertedRecordID = RecordResult.insertId;  // Get the auto-incremented RecordID from the inserted record
    console.log("New Record is created with RecordID:",insertedRecordID);
    callback(insertedRecordID);      // Pass the RecordID to the callback function
  });
}

//=================================================================================================
function insertDrugs(PatientID, Drugs, res, callback) {
  const sql_query_drug = "INSERT INTO drug (PatientID, DName) VALUES (?, ?)";
  connection.query(sql_query_drug, [PatientID, Drugs], (DrugErr, DrugResult) => {
    if (DrugErr) {
      console.error("Error creating drugs:", DrugErr);
      res.status(500).json({ error: "Internal Server Error, Check if PatientID exists" });
      return;
    }
    console.log("New drug is created with PatientID:",PatientID);
    callback();    
  });
}
//=================================================================================================
function insertIllnesses(PatientID, Illnesses, res, callback) {
  const sql_query_drug = "INSERT INTO Illnesses (PatientID, IllnessDescription) VALUES (?, ?)";
  connection.query(sql_query_drug, [PatientID, Illnesses], (DrugErr, DrugResult) => {
    if (DrugErr) {
      console.error("Error creating Illnesses:", DrugErr);
      res.status(500).json({ error: "Internal Server Error, Check if PatientID exists" });
      return;
    }
    console.log("New Illnesse is created with PatientID:",PatientID);
    callback();    
  });
}
//=================================================================================================
function insertMedicalTests(PatientID, MedicalTests, res, callback) {
  const sql_query_drug = "INSERT INTO MedicalTests (PatientID, TestDescription) VALUES (?, ?)";
  connection.query(sql_query_drug, [PatientID, MedicalTests], (DrugErr, DrugResult) => {
    if (DrugErr) {
      console.error("Error creating MedicalTests:", DrugErr);
      res.status(500).json({ error: "Internal Server Error, Check if PatientID exists" });
      return;
    }
    console.log("New MedicalTest is created with PatientID:",PatientID);
    callback();    
  });
}
//=================================================================================================
function insertOperations(PatientID, Operations, res, callback) {
  const sql_query_drug = "INSERT INTO Operations (PatientID, OperationName) VALUES (?, ?)";
  connection.query(sql_query_drug, [PatientID, Operations], (DrugErr, DrugResult) => {
    if (DrugErr) {
      console.error("Error creating Operations:", DrugErr);
      res.status(500).json({ error: "Internal Server Error, Check if PatientID exists" });
      return;
    }
    console.log("New Operation is created with PatientID:",PatientID);
    callback();    
  });
}

//==================================================================================================================
function getemr (req, res)  {         //Get emr
  const { PatientID } = req.query; // Using query parameters instead of req.body
  const sql_query = `SELECT * FROM record WHERE PatientID = ?`;
  connection.query(sql_query, [PatientID], (err, result) => {
    if (err) {
      console.error("Error fetching patient data:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
  }
  if (result.length === 0) {
      res.status(404).json({ message: `No records found for patient with ID ${PatientID}.` });
  } else {
      const patients = processQueryResult(result);
      res.status(200).json(patients);
  }
});
}

//==========================================================================================================================
function processQueryResult(result) {          //Function to process the query result and build the record map
  const recordMap = {};

  result.forEach((row) => {
    const { FirstName,
      PatientID,
      Weight,
      Height,
      Drugs,
      Illnesses,
      MedicalTests,
     Operations,} = row;

    if (!recordMap[PatientID]) {
      recordMap[PatientID] = {
        PatientID,
        RecordID: row.RecordID,
        FirstName: row.FirstName,
        PatientWeight: row.Weight,
        PatientHeight: row.Length,
        Drugs: row.Drugs,
        Illnesses: row.Illnesses,
        MedicalTests: row.MedicalTests,
        Operations: row.Operations,
      };
    }

  });

  return Object.values(recordMap);
}
//=====================================================================================================================
function Createdrug(req, res) {
  const {PatientID,	DName	,DDuration,	DDose,	Notes} = req.body;

  // Insert drug into drug table
  const sql_query_Drug = `INSERT INTO drug (PatientID, DName, DDuration, DDose, Notes) VALUES (?, ?, ?, ?, ?)`;

  // Execute the query to insert the drug
  connection.query(sql_query_Drug, [PatientID, DName, DDuration, DDose, Notes], (drugErr, drugResult) => {
      if (drugErr) {
          console.error(`Error creating Drug`, drugErr);
          res.status(500).json({ error: "Internal Server Error, Check if PatientID exists " });
      } else {
          const insertedDrugID = drugResult.insertId;
          console.log(`New Drug is created with DrugID:`, insertedDrugID);
          res.status(200).json({ message: "New Drug is created" });
      }
  });
}
//=========================================================================================================================
function Createtest(req, res) {
  const {PatientID,	TestDescription	} = req.body;

  // Insert MedicalTests  into MedicalTests  table
  const sql_query_MedicalTests  = `INSERT INTO medicaltests  (PatientID, TestDescription) VALUES (?, ?)`;

  // Execute the query to insert the MedicalTests 
  connection.query(sql_query_MedicalTests , [PatientID, TestDescription], (MedicalTestsErr, MedicalTestsResult) => {
      if (MedicalTestsErr) {
          console.error(`Error creating MedicalTests `, MedicalTestsErr);
          res.status(500).json({ error: "Internal Server Error, Check if PatientID exists " });
      } else {
          const insertedMedicalTestsID = MedicalTestsResult.insertId;
          console.log(`New MedicalTests  is created with MedicalTests ID:`, insertedMedicalTestsID);
          res.status(200).json({ message: "New MedicalTests  is created" });
      }
  });
}

//=========================================================================================================================
function Createservice(req, res) {
  const {PatientID,	ServicesDescription	} = req.body;

  // Insert MedicalServicess  into MedicalServicess  table
  const sql_query_MedicalServicess  = `INSERT INTO services   (PatientID, ServicesDescription) VALUES (?, ?)`;

  // Execute the query to insert the MedicalServicess 
  connection.query(sql_query_MedicalServicess , [PatientID, ServicesDescription], (MedicalServicessErr, MedicalServicessResult) => {
      if (MedicalServicessErr) {
          console.error(`Error creating MedicalServicess `, MedicalServicessErr);
          res.status(500).json({ error: "Internal Server Error, Check if PatientID exists " });
      } else {
          const insertedMedicalServicessID = MedicalServicessResult.insertId;
          console.log(`New MedicalServicess  is created with MedicalServices ID:`, insertedMedicalServicessID);
          res.status(200).json({ message: "New MedicalServices  is created" });
      }
  });
}
//=====================================================================================================================
function Editing(req, res) {
  const {
    PatientID,
    Diagnosis,
    ExtraNotes,
    Height,
    HeartRate,
    RecommendedAction,
    BloodPressure,
    DiabeticTest,
    Weight,
    RespirationRate,
    SPO2
  } = req.body;

// Record table
const checkRecordQuery = 'SELECT * FROM record WHERE PatientID = ?';
connection.query(checkRecordQuery, [PatientID], (err, rows) => {
  if (err) {
    console.error(`Error checking record:`, err);
    res.status(500).json({ error: "Error checking record" });
  } else {
    if (rows.length > 0) {
      // Patient exists, update the record
      const recordUpdateQuery = 'UPDATE record SET Weight = ?, Length = ? WHERE PatientID = ?';
      connection.query(recordUpdateQuery, [Weight, Height, PatientID], (err, results) => {
        if (err) {
          console.error(`Error updating record:`, err);
          res.status(500).json({ error: "Error updating record" });
        } else {
          console.log(`Record updated for PatientID:`, PatientID);
          // No need to send a response here, as we're sending the final response after all queries.
        }
      });
    } else {
      // Patient does not exist, insert a new record
      const recordInsertQuery = 'INSERT INTO record (PatientID, Weight, Length) VALUES (?, ?, ?)';
      connection.query(recordInsertQuery, [PatientID, Weight, Height], (err, results) => {
        if (err) {
          console.error(`Error inserting record:`, err);
          res.status(500).json({ error: "Error inserting record" });
        } else {
          console.log(`Record inserted for PatientID:`, PatientID);
          // No need to send a response here, as we're sending the final response after all queries.
        }
      });
    }
  }
});

// Prescription table
const checkPrescriptionQuery = 'SELECT * FROM prescription WHERE PatientID = ?';
connection.query(checkPrescriptionQuery, [PatientID], (err, rows) => {
  if (err) {
    console.error(`Error checking prescription:`, err);
    res.status(500).json({ error: "Error checking prescription" });
  } else {
    if (rows.length > 0) {
      // Patient exists, update the prescription
      const prescriptionUpdateQuery = 'UPDATE prescription SET Diagnosis = ?, ExtraNotes = ? WHERE PatientID = ?';
      connection.query(prescriptionUpdateQuery, [Diagnosis, ExtraNotes, PatientID], (err, results) => {
        if (err) {
          console.error(`Error updating prescription:`, err);
          res.status(500).json({ error: "Error updating prescription" });
        } else {
          console.log(`Prescription updated for PatientID:`, PatientID);
          // No need to send a response here, as we're sending the final response after all queries.
        }
      });
    } else {
      // Patient does not exist, insert a new prescription
      const prescriptionInsertQuery = 'INSERT INTO prescription (PatientID, Diagnosis, ExtraNotes) VALUES (?, ?, ?)';
      connection.query(prescriptionInsertQuery, [PatientID, Diagnosis, ExtraNotes], (err, results) => {
        if (err) {
          console.error(`Error inserting prescription:`, err);
          res.status(500).json({ error: "Error inserting prescription" });
        } else {
          console.log(`Prescription inserted for PatientID:`, PatientID);
          // No need to send a response here, as we're sending the final response after all queries.
        }
      });
    }
  }
});

// Vital table
const checkVitalQuery = 'SELECT * FROM vital WHERE PatientID = ?';
connection.query(checkVitalQuery, [PatientID], (err, rows) => {
  if (err) {
    console.error(`Error checking vital:`, err);
    res.status(500).json({ error: "Error checking vital" });
  } else {
    if (rows.length > 0) {
      // Patient exists, update the vital information
      const vitalUpdateQuery = 'UPDATE vital SET BloodPressure = ?, RespirationRate = ?, HeartRate = ?, DiabeticTest = ?, SPO2 = ? WHERE PatientID = ?';
      connection.query(vitalUpdateQuery, [BloodPressure, RespirationRate, HeartRate, DiabeticTest, SPO2, PatientID], (err, results) => {
        if (err) {
          console.error(`Error updating vital:`, err);
          res.status(500).json({ error: "Error updating vital" });
        } else {
          console.log(`Vital information updated for PatientID:`, PatientID);
          // No need to send a response here, as we're sending the final response after all queries.
        }
      });
    } else {
      // Patient does not exist, insert new vital information
      const vitalInsertQuery = 'INSERT INTO vital (PatientID, BloodPressure, RespirationRate, HeartRate, DiabeticTest, SPO2) VALUES (?, ?, ?, ?, ?, ?)';
      connection.query(vitalInsertQuery, [PatientID, BloodPressure, RespirationRate, HeartRate, DiabeticTest, SPO2], (err, results) => {
        if (err) {
          console.error(`Error inserting vital:`, err);
          res.status(500).json({ error: "Error inserting vital" });
        } else {
          console.log(`Vital information inserted for PatientID:`, PatientID);
          // No need to send a response here, as we're sending the final response after all queries.
        }
      });
    }
  }
});

// RecommendedAction table
const checkRecommendedActionQuery = 'SELECT * FROM RecommendedAction WHERE PatientID = ?';
connection.query(checkRecommendedActionQuery, [PatientID], (err, rows) => {
  if (err) {
    console.error(`Error checking recommended action:`, err);
    res.status(500).json({ error: "Error checking recommended action" });
  } else {
    if (rows.length > 0) {
      // Patient exists, update the recommended action
      const recommendedActionUpdateQuery = 'UPDATE RecommendedAction SET RecommendedActionDescription = ? WHERE PatientID = ?';
      connection.query(recommendedActionUpdateQuery, [RecommendedAction, PatientID], (err, results) => {
        if (err) {
          console.error(`Error updating recommended action:`, err);
          res.status(500).json({ error: "Error updating recommended action" });
        } else {
          console.log(`Recommended action updated for PatientID:`, PatientID);
          // No need to send a response here, as we're sending the final response after all queries.
        }
      });
    } else {
      // Patient does not exist, insert a new recommended action
      const recommendedActionInsertQuery = 'INSERT INTO RecommendedAction (PatientID, RecommendedActionDescription) VALUES (?, ?)';
      connection.query(recommendedActionInsertQuery, [PatientID, RecommendedAction], (err, results) => {
        if (err) {
          console.error(`Error inserting recommended action:`, err);
          res.status(500).json({ error: "Error inserting recommended action" });
        } else {
          console.log(`Recommended action inserted for PatientID:`, PatientID);
          // No need to send a response here, as we're sending the final response after all queries.
        }
      });
    }
  }
});




  // After all queries are executed, send the final response
  res.status(200).json({ message: "Records updated successfully" });
}


//===================================================================
module.exports = {
  EmrCreate,
  getemr,
  Createdrug,
  Createtest,
  Createservice,
  Editing
};