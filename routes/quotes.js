var express    = require("express"),
    middleware = require("../middleware"),
    User       = require("../models/user"),
    Quote      = require("../models/quote"),
    mongoose   = require("mongoose");

var router = express.Router();

router.get("/", middleware.isLoggedIn, function(req, res) {
    Quote.find(function(err, quotes) {
        if (err) {
            console.log(err);
        } else {
            res.render("quotes", {quotes: quotes.reverse()});
        }
    });
});

router.get("/new", middleware.isLoggedIn, function(req, res) {
    if (req.user.username === "c") { // Only for me!!!
        res.render("quote");
    } else {
        res.send("Nice try, you're not authorized! Nyah nyah :p");
    }
});

router.post("/", middleware.isLoggedIn, function(req, res) {
    if (req.user.username === "c") { //Double check in case someone somehow sent data without the form
        Quote.create(req.body.quote, function(err, quote) {
            if (err) {
                console.log(err);
            } else {
                quote.uploader.id = req.user._id;
                quote.uploader.username = req.body.username;
                console.log("New qoute: ", quote);
                quote.save();
                res.redirect("/quotes");
            }
        });
    } else {
        console.log("User not authorized --Quote POST route");
    }
});

router.delete("/:id", middleware.isLoggedIn, function(req, res) {
    Quote.findByIdAndDelete(req.params.id, function(err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/quotes");
        }
    });
});

module.exports = router;