//Hi there please contact before copying

var methodOverride        = require("method-override"),
    bodyParser            = require("body-parser"),
    mongoose              = require("mongoose"),
    express               = require("express"),
    request               = require("request"),
    moment                = require("moment"),
    ridict                = require('ridict'),
    Entry                 = require("./models/entry"),
    User                  = require("./models/user"),
    Tag                   = require("./models/tag"),
    passport              = require("passport"),
    parseText             = require("./public/parseText"),
    LocalStrategy         = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose");

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
    Tag.find({"user.id": req.user._id}, function(err, tags) {
        if (err) {
            console.log(err);
        } else {
            if (Object.keys(req.query).length === 0) { //if no search query
                Entry.find({"author.id": req.user._id}, function(err, entries) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.render("index", {tags: tags, entries: entries.reverse(), keyword: ""});
                    }
                });
            } else {
                Entry.find({"author.id": req.user._id, $text: { $search: req.query.keyword }}, function(err, entries) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.render("index", {tags: tags, entries: entries.reverse(), keyword: req.query.keyword});
                    }
                });
            }
        }
    });
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
                    var tags = parseText(req.body.tags);
                    entry.tags = tags;
                    entry.metadata = "";
                    entry.author.id = req.user._id;
                    entry.author.username = req.user.username;
                    entry.save();
                    
                    console.log(ridict.matches(entry.body));
                    
                    user.entries.push(entry);
                    user.save();
                    
                    var i =0;
                    Tag.findOne({"name": tags[i], "user.id": req.user._id}, function(err, tag) {
                        if (err) {
                            console.log(err);
                        } else {
                            if (!tag) {
                                var newTag = {
                                    name: tags[i],
                                    user: {
                                        id: req.user._id,
                                        username: req.user.username
                                    },
                                    entries: [entry]
                                };
                                
                                Tag.create(newTag, function(err, tagGuy) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    // tagGuy.entries.push(entry)
                                });
                            } else {
                                tag.entries.push(entry);
                                tag.save();
                            }
                        }
                    });
                    
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
    //add middleware to check that user === entry.author
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

app.get("/tag/:id", isLoggedIn, function(req, res) {
    Tag.findById(req.params.id).populate("entries").exec(function(err, tag) {
        if (err) {
            console.log(err);
        } else {
            Tag.find({"user.id": req.user._id}, function(err, tags) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("tag", {tag: tag, tags: tags, keyword: ""});
                }
            });
        }
    });
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

app.get("/account", isLoggedIn, function(req, res) {
    Entry.find({"author.id": req.user._id}, function(err, entries) {
        if (err) {
            console.log(err);
        }
        var entryCount = entries.length;
        res.render("account", {entryCount: entryCount});
    });
});

app.delete("/account", isLoggedIn, function(req, res) {
    User.findByIdAndRemove(req.user._id, function(err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
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
