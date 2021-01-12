var express    = require("express"),
    middleware = require("../middleware"),
    Quote      = require("../models/quote"),
    errorHandlers = require("../helpers/errorHandlers"),
    Global      = require("../models/global");

var router = express.Router();

router.get("/", middleware.isLoggedIn, middleware.isAdmin, function(req, res) {
    Quote.find(function(err, quotes) {
        if (err) {
            errorHandlers.dbError(res, err);
        }
        res.render("quotes", {quotes: quotes.reverse()});
    });
});

router.get("/new", middleware.isLoggedIn, middleware.isAdmin, function(req, res) {
    res.render("quote");
});

router.post("/", middleware.isLoggedIn, middleware.isAdmin, function(req, res) {
    Quote.create(req.body.quote, function(err, quote) {
        if (err) {
            errorHandlers.dbError(res, err);
        }
        quote.uploader.id = req.user._id;
        quote.uploader.username = req.body.username;
        console.log("New qoute: ", quote);
        quote.save();
        res.redirect("/quotes");
    });
});

router.delete("/:id", middleware.isLoggedIn, middleware.isAdmin, function(req, res) {
    Quote.findByIdAndDelete(req.params.id, function(err) {
        if (err) {
            errorHandlers.dbError(res, err);
        }
        Global.findOne({}, { currentQuote: 1 }, function (globalErr, global) {
            if (globalErr) {
                errorHandlers.dbError(res, globalErr);
            }
            if (global.currentQuote._id == req.params.id) {
                // re-determine current quote of the day
                Global.findOne({}, function(err, globalBoi) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("updating immediately");
                        Quote.find({}, {index: 1, _id: 0}, function(err, quotes) {
                            if (err) {
                                console.log(err);
                            } else {
                                var min = quotes[0].index;
                                for (var i = 1; i < quotes.length; i++) {
                                    if (quotes[i].index < min) {
                                        min = quotes[i].index;
                                    }
                                }
                                
                                Quote.find({index: min}, function(err, candidates) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        var luckyWinner = Math.floor(Math.random()*candidates.length);
                                        var winnerId = candidates[luckyWinner]._id;
                                        Quote.findById(winnerId, function(err, quote) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                quote.index++;
                                                quote.save();
                                                Global.update({}, { currentQuote: quote, lastUpdate: Date.now() }, function(err, global) { // There should only ever be one
                                                    if (err) {
                                                        console.log(err);
                                                    } else {
                                                        res.redirect("/quotes");
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    });
});

router.post("/reset", function(req, res) {
    Quote.updateMany({}, { $set: { index: 0 } }, function(err) {
        if (err) {
            errorHandlers.dbError(res, err);
        }
        res.redirect("/quotes");
    })
})

module.exports = router;