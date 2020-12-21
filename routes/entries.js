const express = require("express"),
  middleware = require("../middleware"),
  EntriesController = require("../controllers/EntriesController");

const router = express.Router();

router.get("/", middleware.isLoggedIn, function (req, res) {
	EntriesController.allEntriesPage(req, res);
});

router.get("/new", middleware.isLoggedIn, function (req, res) {
	EntriesController.newEntryPage(req, res);
});

// entry show page
router.get("/:id", middleware.isLoggedIn, function (req, res) {
  EntriesController.entryShowPage(req, res);
});

router.get("/:id/edit", middleware.isLoggedIn, function (req, res) {
	EntriesController.entryEditPage(req, res);
});

// when "search" button clicked, this runs
router.post("/search", middleware.isLoggedIn, function (req, res) {
  res.redirect("/entries/" + "?keyword=" + req.body.searchterm);
});

router.post("/", middleware.isLoggedIn, function (req, res) {
  EntriesController.createNewEntry(req, res);
});

router.put("/:id", middleware.isLoggedIn, function (req, res) {
	EntriesController.updateEntry(req, res);
});

router.delete("/:id", middleware.isLoggedIn, async function (req, res) {
  EntriesController.deleteEntry(req, res);
});

module.exports = router;
