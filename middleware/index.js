var Global    = require("../models/global"),
    Quote     = require("../models/quote"),
    User      = require("../models/user"),
    moment    = require("moment"),
    mongoose  = require("mongoose");

var middlewareObj = {
    isLoggedIn: function(req, res, next) {
        if(req.isAuthenticated()) {
            return next();
        }
        req.flash("error", "Please log in first");
        res.redirect("/login");
    },
    isAdmin: function(req, res, next) {
        User.findOne({"username": req.user.username}, function(err, user) {
            if (err) {
                console.log(err);
            } else {
                if (req.user.isAdmin) {
                    return next();
                } else {
                    console.log("User not authorized --isAdmin middleware");
                    req.flash("error","Nice try, but only administrators can do that!");
                    res.redirect("/home");
                }
            }
        });
    },
    checkAchievements: function(req, res, next) {
        User.findOne({"username": req.user.username}, function(err, user) {
    },
    updateQuote: function(req, res, next) {
        Global.findOne({}, function(err, globalBoi) {
            if (err) {
                console.log(err);
            } else {
                console.log("Time since last quote update:");
                console.log(new Date() - globalBoi.lastUpdate);
                if (Date.now() - globalBoi.lastUpdate >= 1000 * 60 * 60 * 24) {
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
                            console.log("Indicies: ", quotes);
                            console.log("min: ", min)
                            
                            Quote.find({index: min}, function(err, candidates) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    var luckyWinner = Math.floor(Math.random()*candidates.length);
                                    var winnerId = candidates[luckyWinner]._id;
                                    console.log(luckyWinner, winnerId);
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
                                                    return next();
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                } else {
                    return next();
                }
            }
        });
    }
};


module.exports = middlewareObj;