const express = require('express');
const router = express.Router();

const serverController = require("../controllers/serverController.js");

//=========================================================================================
router.post("/server", serverController.serverdata);
router.get("/serverdata", serverController.senddata);

//=========================================================================================================
module.exports = router;
