/**
 * This file contains all the handlers for requests that fetch or update data without reloading the page.
 */

const express = require("express"),
  middleware = require("../middleware"),
  ApiController = require("../controllers/ApiController");

const router = express.Router();
const theController = new ApiController();

/**
 * Sets the user's showEntrySummaries to yes or no based on the request.
 * See DB schema file for details on user settings. 
 */
router.post("/userSettings/showSummaries", middleware.isLoggedIn, (req, res) => {
  theController.setEntrySummaries(req, res);
});

/**
 * Gets all entries, paginated by the integer parameter page.
 */
router.get("/entries/:page", middleware.isLoggedIn, (req, res) => {
  theController.getEntries(req, res, req.params.page);
});

module.exports = router;
