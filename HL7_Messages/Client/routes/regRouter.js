const express = require('express');
const router = express.Router();

const regController = require("../controllers/regController");

//===================================================================================================
router.post("/registration", regController.registerUser);                // POST New patient
router.post("/login", regController.loginUser);                   // login 
router.get("/patient", regController.getPatientbyID);                // get patient
router.get("/getPatientAndEMR/:patientID", regController.getPatientAndEMR); 
router.get("/getPatientRecord/:patientID", regController.getPatientrecord); 
router.put("/updatePatient", regController.updatePatientByID);                // update patient info
//===================================================================================================

module.exports =  router;      // Export the 'router' object