var express    = require("express"),
    User       = require("../models/user"),
    middleware = require("../middleware"),
    mongoose   = require("mongoose");

var router = express.Router();


router.get("/quotes/new", middleware.isLoggedIn, function(req, res) {
    if (req.user.username === "c") { // Only for me!!!
        res.render("quote");
    } else {
        res.send("Nice try, you're not authorized! Nyah nyah :p");
    }
});

module.exports = router;