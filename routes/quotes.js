var express    = require("express"),
    middleware = require("../middleware"),
    User       = require("../models/user"),
    Quote      = require("../models/quote"),
    mongoose   = require("mongoose");

var router = express.Router();

router.get("/", middleware.isLoggedIn, middleware.isAdmin, function(req, res) {
    Quote.find(function(err, quotes) {
        if (err) {
            console.log(err);
        } else {
            res.render("quotes", {quotes: quotes.reverse()});
        }
    });
});

router.get("/new", middleware.isLoggedIn, middleware.isAdmin, function(req, res) {
    res.render("quote");
});

router.post("/", middleware.isLoggedIn, middleware.isAdmin, function(req, res) {
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
});

router.delete("/:id", middleware.isLoggedIn, middleware.isAdmin, function(req, res) {
    Quote.findByIdAndDelete(req.params.id, function(err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/quotes");
        }
    });
});

router.post("/reset", function(req, res) {
    Quote.updateMany({}, { $set: { index: 0 } }, function(err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/quotes");
        }
    })
})

module.exports = router;