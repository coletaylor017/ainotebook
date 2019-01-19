var express    = require("express"),
    Entry      = require("../models/entry"),
    User       = require("../models/user"),
    middleware = require("../middleware"),
    passport   = require("passport");

var router = express.Router();

router.get("/", function(req, res) {
    res.render("landing");
});

router.get("/about", function(req, res) {
    res.render("about");
});

//Register
router.get("/register", function(req, res) {
    res.render("signup");
});

router.post("/register", function(req, res) {
    User.register(new User({username: req.body.username}), req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            req.flash("error", err.message);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function() {
            req.flash("success", "Welcome to Writing Blocks, " + user.username + "! Time to start your first freewriting session!");
            res.redirect("/entries/new");
        });
    });
});

//Login
router.get("/login", function(req, res) {
    res.render("login");
});

router.post("/login", passport.authenticate("local", {
    successRedirect: "/entries/new",
    failureRedirect: "/login",
    failureFlash: true
}), function(req, res) {
});

router.get("/account", middleware.isLoggedIn, function(req, res) {
    User.findOne({username: req.user.username}, function(err, user) {
        if (err) {
            console.log(err);
        } else {
            // var date = new Date();
            // if (date - user.lastEntry > 86400000) { // if the difference is greater than 24 hours
            //     user.streak = 0;
            // }
            Entry.find({"author.id": req.user._id}, {body: 1, _id: 0}, function(err, entries) {
                if (err) {
                    console.log(err);
                }
                var wordCount = 0;
                entries.forEach(function(entry) {
                    var l = entry.body.split(" ");
                    wordCount += l.length;
                });
                var entryCount = entries.length;
                res.render("account", {entryCount: entryCount, wordCount: wordCount});
                // Optimization uestion: Is it better to do calculation on the server side or pass the entire entry body to the client and do the calculation there?
            });
        }
    });
});

router.delete("/account", middleware.isLoggedIn, function(req, res) {
    User.findByIdAndRemove(req.user._id, function(err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
});

//logout
router.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

module.exports = router;