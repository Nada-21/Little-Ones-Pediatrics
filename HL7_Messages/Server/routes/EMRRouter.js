const express = require('express');
const router = express.Router();
const EMRController = require("../controllers/EMRController");
//=========================================================================================================================
router.post('/EMR', EMRController.EmrCreate); //  create EMR
router.get('/EMR', EMRController.getemr); //  get EMR
router.post('/drug', EMRController.Createdrug); //  create drug
router.post('/test', EMRController.Createtest); //  create test
router.post('/service', EMRController.Createservice); //  create service
router.put('/edit', EMRController.Editing); //  edit
//=========================================================================================================================
module.exports = router;
