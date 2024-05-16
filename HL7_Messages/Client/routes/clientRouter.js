const express = require('express');
const router = express.Router();
const clientController = require("../controllers/clientController");
//=========================================================================================================================
router.post('/client', clientController.sendAppointment); 
//=========================================================================================================================
module.exports = router;
