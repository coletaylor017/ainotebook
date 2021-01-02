var express = require("express"),
    Entry = require("../models/entry"),
    User = require("../models/user"),
    Quote = require("../models/quote"),
    Global = require("../models/global"),
    middleware = require("../middleware"),
    passport = require("passport"),
    errorHandlers = require("../helpers/errorHandlers");

var router = express.Router();

router.get("/", function (req, res) {
    res.render("landing");
});

// For frontend debugging purposes only
router.get("/dberror", function(req, res) {
    errorHandlers.dbError(res, "Error");
});

router.get("/about", function (req, res) {
    res.render("about");
});

router.get("/terms", function (req, res) {
    res.render("terms");
})

router.get("/register", function (req, res) {
    res.render("signup");
});

router.post("/register", function (req, res) {
    User.register(new User({ username: req.body.username }), req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            req.flash("error", err.message);
            return res.redirect("back");
        }
        passport.authenticate("local")(req, res, function () {
            req.flash("success", "Welcome aboard, " + user.username + "!");
            res.redirect("/home");
        });
    });
});

//Login
router.get("/login", function (req, res) {
    res.render("login");
});

router.post("/login", passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login",
    failureFlash: true
}));

router.get("/account", middleware.isLoggedIn, function (req, res) {
    res.render("account");
});

router.get("/home", middleware.isLoggedIn, middleware.updateQuote, function (req, res) {
    Entry.find({ "author.id": req.user._id }, { body: 1, _id: 0 }, function (err, entries) {
        if (err) {
            errorHandlers.dbError(res, err);
        }
        var wordCount = 0;
        entries.forEach(function (entry) {
            var l = entry.body.split(" ");
            wordCount += l.length;
        });
        var entryCount = entries.length;

        Global.findOne({}, { currentQuote: 1 }, function (globalErr, global) {
            if (globalErr) {
                errorHandlers.dbError(res, globalErr);
            }
            Quote.findById(global.currentQuote, function (quoteErr, quote) {
                if (quoteErr) {
                    errorHandlers.dbError(res, quoteErr);
                }
                res.render("home", { quote: quote, entryCount: entryCount, wordCount: wordCount });
            });
        })
    });
});

router.get("/data", middleware.isLoggedIn, function (req, res) {
    Entry.find({ "author.id": req.user._id }, { date: 1, metadata: 1, body: 1 }, function (err, entries) {
        if (err) {
            errorHandlers.dbError(res, err);
        }
        res.render("data", { entries: entries });

    });
});

router.delete("/account", middleware.isLoggedIn, function (req, res) {
    User.findByIdAndRemove(req.user._id, function (err) {
        if (err) {
            errorHandlers.dbError(res, err);
        }
        res.redirect("/");
    });
});

//logout
router.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

router.post("/account", middleware.isLoggedIn, function (req, res) {
    console.log(req.body.emails);

    User.findById(req.user._id, function (err, user) {
        if (err) {
            errorHandlers.dbError(res, err);
        }
        if (req.body.emails) {
            user.settings.emails = 1;
        } else {
            user.settings.emails = 0;
        }
        var hour = req.body.emailTime.substring(0, 2);
        var minute = req.body.emailTime.substring(3, 5);
        console.log(hour + " : " + minute);
        user.emails = req.body.emails;
        user.settings.emailHour = hour;
        user.settings.emailMinute = minute;
        user.save();
    });
    res.redirect("/account");
});

module.exports = router;