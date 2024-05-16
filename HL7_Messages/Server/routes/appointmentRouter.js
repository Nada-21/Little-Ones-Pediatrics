const express = require('express');
const router = express.Router();

const AppointmentController = require("../controllers/appointmentController");

//===================================================================================================
router.post("/appointment", AppointmentController.createAppointment);                // POST New Appointmen
// router.get('/appointment', AppointmentController.getAllAppointments);                   // GET All Appointmens
router.get("/appointment/:doctorUsername", AppointmentController.getAppointmentByDoctorUsername);    // GET appointments by DoctorID
// router.get("/appointment/:patientId", AppointmentController.getAppointmentByPatientID);    // GET appointments by PatientID
// router.put("/appointment/:patientId", AppointmentController.updateAppointmentByPatientID);   // Update appointment by patientId
router.delete("/appointment/:appointmentId", AppointmentController.deleteappointmentByappointmentId);   // delete appointment by patientId
//===================================================================================================

module.exports =  router;      // Export the 'router' object

