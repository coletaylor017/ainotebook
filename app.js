//Remember to save v 1.0.0 for sentimental value and to show how far it progresses
/*TODO/IDEAS

By Thanksgiving: 
-User intro blurbs

Features:
    -User intro prompts (priority)
    -Tags side box
    -Metadata
    -Daily quotes, for more deets on this see /models/quotes.js
    -Search
    -Make middleware to check entry owner before updating
    -Flash error messages for invalid login, etc.

UI:
    -Acutally install Semantic, then do these:
        -Make trash hover red
        -Light/dark themes
        -Make "New Block" button stay put while entries scroll
        -"..." and "read more"(?) at end of truncated entries
        -show line breaks on entry view page

Database/security:
    -Issue: users still reference post IDs after the posts are deleted
    
Done!
    -Associate users and entries, restrict acces to the owner
    -Show tooltip hints when user hovers on icons
    -Search
*/

var methodOverride        = require("method-override"),
    bodyParser            = require("body-parser"),
    mongoose              = require("mongoose"),
    express               = require("express"),
    request               = require("request"),
    moment                = require('moment'),
    Entry                 = require("./models/entry"),
    User                  = require('./models/user'),
    passport              = require('passport'),
    LocalStrategy         = require("passport-local"),
    passportLocalMongoose = require('passport-local-mongoose');

var url = process.env.DATABASEURL || "mongodb://localhost:27017/writing_blocks";
mongoose.connect(url, {useNewUrlParser: true});

var app = express();
app.set("view engine", "ejs");

app.locals.moment = require('moment');

app.use(methodOverride("_method"));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(require("express-session")({
    secret: "I sawed this boat in half!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser()); 

app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    next();
});

app.get("/", function(req, res) {
    res.render("landing");
});

//index
app.get("/entries", isLoggedIn, function(req, res) {
    //if no search query
    if (Object.keys(req.query).length === 0) {
        Entry.find({"author.id": req.user._id}, function(err, entries) {
            if (err) {
                console.log(err);
            } else {
                res.render("index", {entries: entries.reverse(), keyword: ""});
            }
        });
    } else {
        Entry.find({"author.id": req.user._id, $text: { $search: req.query.keyword }}, function(err, entries) {
            if (err) {
                console.log(err);
            } else {
                res.render("index", {entries: entries.reverse(), keyword: req.query.keyword});
            }
        });
    }
});

app.post("/entries/search", function(req, res) {
    res.redirect("/entries/" + "?keyword=" + req.body.searchterm);
});

//new
app.get("/entries/new", isLoggedIn, function(req, res) {
    res.render("new");
});

//create
app.post("/entries", isLoggedIn, function(req, res) {
    User.findOne({username: req.user.username}, function(err, user) {
        if (err) {
            console.log(err);
        } else {
            Entry.create(req.body.entry, function(err, entry) {
                if (err) {
                    console.log(err);
                } else {
                    entry.metadata = "";
                    entry.author.id = req.user._id;
                    entry.author.username = req.user.username;
                    entry.save();
                    
                    user.entries.push(entry);
                    user.save();
                    
                    res.redirect("/entries");
                }
            });
        }
    });
});

//show
app.get("/entries/:id", isLoggedIn, function(req, res) {
    Entry.findById(req.params.id, function(err, entry) {
        if (err) {
            console.log(err);
        } else {
            res.render("show", {entry: entry});
        }
    });
});

//edit
app.get("/entries/:id/edit", isLoggedIn, function(req, res) {
    Entry.findById(req.params.id, function(err, entry) {
        if (err) {
            console.log(err);
        } else {
            res.render("edit", {entry: entry});
        }
    });
});

//update
app.put("/entries/:id", isLoggedIn, function(req, res) {
    Entry.findByIdAndUpdate(req.params.id, req.body.entry, function(err, user) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/entries/" + req.params.id);
        }
    });
});

//destroy
app.delete("/entries/:id", isLoggedIn, function(req, res) {
    Entry.findByIdAndRemove(req.params.id, function(err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/entries");
        }
    });
    //Here, we should remove the entry from the user's entry references list
});

app.get("/about", function(req, res) {
    res.render("about");
});

//Register
app.get("/register", function(req, res) {
    res.render("signup");
});

app.post("/register", function(req, res) {
    User.register(new User({username: req.body.username}), req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function() {
            res.redirect("/entries");
        });
    });
});

//Login
app.get("/login", function(req, res) {
    res.render("login");
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/entries",
    failureRedirect: "/login"
}), function(req, res) {
});

//logout
app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

app.listen(process.env.PORT, function() {
    console.log("Server is now running");
});
