var express    = require("express"),
    Entry      = require("../models/entry"),
    User       = require("../models/user"),
    Quote      = require("../models/quote"),
    Global     = require("../models/global"),
    middleware = require("../middleware"),
    sgMail     = require('@sendgrid/mail'),
    CronJob    = require('cron').CronJob,
    passport   = require("passport");
    
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// const msg = {
//     to: ['coletaylor017@gmail.com', 'cnovac01@gmail.com'],
//     from: 'donotreply@writing-blocks.herokuapp.com',
//     subject: 'Yay!',
//     html: '<h1>This is a scheduled message sent using SendGrid. It should arrive at 1549985880, or UTC 15:38 on February 12th, 2019.</h1>',
//     send_each_at: [1549985880, 1549985880]
// };
// sgMail.send(msg);

// var CronJob = require('cron').CronJob;
// new CronJob('* * * * * *', function() {
//   console.log('You will see this message every second');
// }, null, true, 'America/Los_Angeles');

    
// // using SendGrid's v3 Node.js Library
// // https://github.com/sendgrid/sendgrid-nodejs
// const sgMail = require('@sendgrid/mail');
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// const msg = {
//   to: 'coletaylor017@gmail.com',
//   from: 'cnovac01@gmail.com',
//   subject: 'Buh.',
//   html: '<h1>B U H</h1>'
// };
// sgMail.send(msg);

var router = express.Router();

router.get("/", function(req, res) {
    res.render("landing");
});

router.get("/about", function(req, res) {
    res.render("about");
});

router.get("/terms", function(req, res) {
    res.render("terms");
})

//Register
router.get("/register", function(req, res) {
    res.render("signup");
});

router.post("/register", function(req, res) {
    User.register(new User({username: req.body.username}), req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            req.flash("error", err.message);
            return res.redirect("back");
        }
        passport.authenticate("local")(req, res, function() {
            req.flash("success", "Welcome to Writing Blocks, " + user.username + "! Time to start your first freewriting session!");
            res.redirect("/home");
        });
    });
});

//Login
router.get("/login", function(req, res) {
    res.render("login");
});

router.post("/login", passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login",
    failureFlash: true
}), function(req, res) {
});

router.get("/account", middleware.isLoggedIn, function(req, res) {
    res.render("account");
});

router.get("/home", middleware.isLoggedIn, middleware.updateQuote, middleware.updateStats, middleware.checkAchievements, function(req, res) {
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
                Entry.find({"author.id": req.user._id, "hidden": 1}, {hidden: 1, _id: 0}, function(err, hiddenEntries) { // return as little as possible for speed
                    if (err) {
                        console.log(err);
                    } else {
                        var hidden = hiddenEntries.length;
                        Global.findOne({}, { currentQuote: 1 }, function(err, global) {
                            if (err) {
                                console.log(err);
                            } else {
                                Quote.findById(global.currentQuote, function(err, quote) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        res.render("home", {quote: quote, entryCount: entryCount, wordCount: wordCount, hidden: hidden});
                                    }
                                })
                            }
                        })
                    }
                });
                // Optimization uestion: Is it better to do calculation on the server side or pass the entire entry body to the client and do the calculation there?
            });
        }
    });
});

router.get("/data", middleware.isLoggedIn, function(req, res) {
    Entry.find({ "author.id": req.user._id }, { date: 1, metadata: 1, body: 1 }, function(err, entries) {
        if (err) {
            console.log(err);
        } else {
            res.render("data", { entries: entries });
        }
    });
});

    // Entry.find({"author.id": req.user._id, "hidden": 0, $text: { $search: req.query.keyword } }).populate("tags", "name").exec(function(err, entries) {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         res.render("index", {tags: tags, entries: entries.reverse(), keyword: req.query.keyword});
    //     }
    // });
                
router.post("/data", middleware.isLoggedIn, function(req, res) {
    res.redirect("/data/" + "?category=" + req.body.category);
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

router.post("/account", middleware.isLoggedIn, function(req, res) {
    console.log(req.body.emails);
    // var job = new CronJob({cronTime: '* * 22 * * *', onTick: function() {
    //     // const msg = {
    //     //     to: 'coletaylor017@gmail.com',
    //     //     from: 'donotreply@writing-blocks.herokuapp.com',
    //     //     subject: 'Have you done your freewriting yet today?',
    //     //     html: '<h1>Get on it!</h1><a>GO!</a>'
    //     // };
    //     // sgMail.send(msg);
    //     console.log("sending a reminder email");
    // }, utcOffset: -req.body.timezone});
    // job.start();

    User.findById(req.user._id, function(err, user) {
        if (err) {
            console.log(err);
        } else {
            if (req.body.emails) {
                user.settings.emails = 1;
            } else {
                user.settings.emails = 0;
            }
            var hour = req.body.emailTime.substring(0, 2);
            var minute = req.body.emailTime.substring(3, 5);
            console.log(hour+" : "+minute);
            user.emails = req.body.emails;
            user.settings.emailHour = hour;
            user.settings.emailMinute = minute;
            user.save();
        }
    });
    res.redirect("/account");
});

module.exports = router;