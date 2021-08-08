/**
 * This file contains all the handlers for requests that fetch or update data without reloading the page.
 */

const express = require("express"),
  middleware = require("../middleware"),
  ApiController = require("../controllers/ApiController");

const router = express.Router();

/**
 * Sets the user's showEntrySummaries to yes or no based on the request.
 * See DB schema file for details on user settings. 
 */
router.post("/userSettings/showSummaries", middleware.isLoggedIn, function (req, res) {
  ApiController.setEntrySummaries(req, res);
});

module.exports = router;
