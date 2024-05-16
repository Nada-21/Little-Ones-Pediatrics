const express = require('express');
const router = express.Router();
const doctorsController = require("../controllers/doctorsController");
//=========================================================================================================================
router.get('/doctors', doctorsController.getDoctor); // GET all doctors
router.post('/doctor/login', doctorsController.getDoctorbyusername); //  doctor by username
//=========================================================================================================================
module.exports = router;
