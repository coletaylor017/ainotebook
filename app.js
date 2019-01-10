//Hi there please contact before copying

var methodOverride        = require("method-override"),
    bodyParser            = require("body-parser"),
    mongoose              = require("mongoose"),
    express               = require("express"),
    request               = require("request"),
    moment                = require("moment"),
    ridict                = require("ridict"),
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

app.use('/scripts', express.static(__dirname + '/node_modules/@yaireo/tagify/'));

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
                Entry.find({"author.id": req.user._id}).populate("tags", "name").exec(function(err, entries) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.render("index", {tags: tags, entries: entries.reverse(), keyword: ""});
                    }
                });
            } else {
                Entry.find({"author.id": req.user._id, $text: { $search: req.query.keyword } }).populate("tags", "name").exec(function(err, entries) {
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
    Tag.find({"user.id": req.user._id}, {name: 1, _id: 0}, function(err, tags) {
        if (err) {
            console.log(err);
        } else {
            console.log(tags);
            var tagArr = [];
            tags.forEach(function(tag) {
                tagArr.push(tag.name);
            });
            console.log(tagArr);
            res.render("new", {tags: tagArr});
        }
    });
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
                    
                    console.log("ridict analysis: ", ridict.matches(entry.body));
                    
                    user.entries.push(entry);
                    user.save();
                    console.log("req.body.tags: ", req.body.tags);
                    if (req.body.tags.length === 0) {
                        res.redirect("/entries");
                    } else {
                        var tags = JSON.parse(req.body.tags);
                        console.log("tags: ", tags);
                        var tags2= [];
                        console.log("tags length: ", tags.length);
                        for (var i = 0; i < tags.length; i++) {
                            tags2.push(tags[i].value);
                            console.log("value of item ", i, "of tags: ", tags[i].value);
                        }
                        console.log("tags2: ", tags2);
                        console.log("tags: ", tags);
                        Tag.find({ "name": { $in: tags2 }, "user.id": req.user._id }, function(err, oldTags) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log("oldTags: ", oldTags);
                                var oldTags2 = [];
                                for (var i = 0; i < oldTags.length; i++) {
                                    oldTags2.push(oldTags[i].name);
                                    console.log("value of item ", i, "of oldTags: ", oldTags[i].name);
                                }
                                console.log("oldTags2: ", oldTags2);
                                // https://stackoverflow.com/questions/1187518/how-to-get-the-difference-between-two-arrays-in-javascript
                                Array.prototype.diff = function(a) {
                                    return this.filter(function(i) {return a.indexOf(i) < 0;});
                                };
                                var filtered = tags2.diff(oldTags2); 
                                console.log("tags2, filtered (filtered): ", filtered);
                                var newTagArr = [];
                                filtered.forEach(function(tagVal) {
                                    var oid = mongoose.Types.ObjectId();
                                    newTagArr.push({
                                        _id: oid,
                                        name: tagVal,
                                        user: {
                                            id: req.user._id,
                                            username: req.user.username
                                        },
                                        entries: []
                                    });
                                });
                                Tag.insertMany(newTagArr, function() {
                                    var tagsToPush = oldTags.concat(newTagArr);
                                    console.log("tagsToPush: ", tagsToPush);
                                    console.log("entry id: ", entry._id);
                                    Entry.findById(entry._id, function(err, foundEntry) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            console.log("foundEntry: ", foundEntry);
                                            Entry.findByIdAndUpdate(
                                                entry._id,
                                                { $addToSet: { tags: { $each: tagsToPush } } },
                                                function(err, results) {
                                                    if (err) {
                                                        console.log(err);
                                                    } else {
                                                        console.log("results of updateOne(): ", results);
    // Welcome.... TO CALLBACK HELL!!!
                                                        Tag.updateMany(
                                                            { "name": { $in: tags2 }, "user.id": req.user._id }, 
                                                            { $addToSet: { entries: entry } }, 
                                                            function(err, results2) {
                                                                if (err) {
                                                                    console.log(err);
                                                                } else {
                                                                    console.log("results of updateMany(): ", results2);
                                                                    res.redirect("/entries");
                                                                }
                                                            }
                                                        );
                                                    }
                                                }
                                            );
                                        }
                                    });
                                });
                            }
                        });
                    }
                }
            });
        }
    });
});

//show
app.get("/entries/:id", isLoggedIn, function(req, res) {
    Entry.findById(req.params.id).populate("tags", "name").exec(function(err, entry) {
        if (err) {
            console.log(err);
        } else {
            res.render("show", {entry: entry});
        }
    });
});

//edit
app.get("/entries/:id/edit", isLoggedIn, function(req, res) {
    Entry.findById(req.params.id).populate("tags", "name").exec(function(err, entry) {
        if (err) {
            console.log(err);
        } else {
            var tagNames = [];
            console.log(entry.tags);
            entry.tags.forEach(function(tag) {
                tagNames.push(tag.name);
            });
            console.log(tagNames);
            res.render("edit", {entry: entry, tags: tagNames});
        }
    });
});

//update
app.put("/entries/:id", isLoggedIn, function(req, res) {
    Entry.findByIdAndUpdate(req.params.id, req.body.entry, function(err, entry) {
        if (err) {
            console.log(err);
        } else {
            if (req.body.tags.length === 0) {
                res.redirect("/entries");
            } else {
                console.log("req.body.tags: ", req.body.tags);
                var tags = JSON.parse(req.body.tags);
                console.log("tags: ", tags);
                var tags2= [];
                console.log("tags length: ", tags.length);
                for (var i = 0; i < tags.length; i++) {
                    tags2.push(tags[i].value);
                    console.log("value of item ", i, "of tags: ", tags[i].value);
                }
                console.log("tags2: ", tags2);
                
                console.log("ridict analysis: ", ridict.matches(entry.body));
                
                console.log("tags: ", tags);
                Tag.find({ "name": { $in: tags2 }, "user.id": req.user._id }, function(err, oldTags) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("oldTags: ", oldTags);
                        var oldTags2 = [];
                        for (var i = 0; i < oldTags.length; i++) {
                            oldTags2.push(oldTags[i].name);
                            console.log("value of item ", i, "of oldTags: ", oldTags[i].name);
                        }
                        console.log("oldTags2: ", oldTags2);
                        // https://stackoverflow.com/questions/1187518/how-to-get-the-difference-between-two-arrays-in-javascript
                        Array.prototype.diff = function(a) {
                            return this.filter(function(i) {return a.indexOf(i) < 0;});
                        };
                        var filtered = tags2.diff(oldTags2); 
                        console.log("tags2, filtered (filtered): ", filtered);
                        var newTagArr = [];
                        filtered.forEach(function(tagVal) {
                            var oid = mongoose.Types.ObjectId();
                            newTagArr.push({
                                _id: oid,
                                name: tagVal,
                                user: {
                                    id: req.user._id,
                                    username: req.user.username
                                },
                                entries: []
                            });
                        });
                        Tag.insertMany(newTagArr, function() {
                            var tagsToPush = oldTags.concat(newTagArr);
                            console.log("tagsToPush: ", tagsToPush);
                            console.log("entry id: ", entry._id);
                            Entry.findById(entry._id, function(err, foundEntry) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log("foundEntry: ", foundEntry);
                                    Entry.findByIdAndUpdate(
                                        entry._id,
                                        { $addToSet: { tags: { $each: tagsToPush } } },
                                        function(err, results) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                console.log("results of updateOne(): ", results);
    // Welcome.... TO CALLBACK HELL!!!
                                                Tag.updateMany(
                                                    { "name": { $in: tags2 }, "user.id": req.user._id }, 
                                                    { $addToSet: { entries: entry } }, 
                                                    function(err, results2) {
                                                        if (err) {
                                                            console.log(err);
                                                        } else {
                                                            console.log("results of updateMany(): ", results2);
                                                            res.redirect("/entries");
                                                        }
                                                    }
                                                );
                                            }
                                        }
                                    );
                                }
                            });
                        });
                    }
                });
            }
        }
    });
});

//destroy
app.delete("/entries/:id", isLoggedIn, function(req, res) {
    User.findOneAndUpdate({ "_id": req.user._id }, { $pull: { entries: req.params.id } }, function(err) {
        if (err) {
            console.log(err);
        } else {
            // I would select only tags that reference the entry being deleted, but I'm lazy.
            // Maybe later if I'm looking for performance gains.
            Tag.updateMany({ "user.id": req.user._id }, { $pull: { entries: req.params.id } }, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    Entry.findByIdAndDelete(req.params.id, function(err) {
                        if (err) {
                            console.log(err);
                        } else {
                            res.redirect("/entries");
                        }
                    });
                }
            });
        }
    });
});

app.get("/tags/:id", isLoggedIn, function(req, res) {
    Tag.findById(req.params.id).populate({ path: 'entries', populate: { path: 'tags', select: 'name' } }).exec(function(err, tag) {
        if (err) {
            console.log(err);
        } else {
            res.render("tag", {tag: tag, keyword: ""});
        }
    });
});

app.delete("/tags/:id", isLoggedIn, function(req, res) {
    Entry.findOneAndUpdate({ "tags": req.params.id }, { $pull: { tags: req.params.id } }, function(err) {
        if (err) {
            console.log(err);
        } else {
            // User.update( { _id: userId }, { $pull: { followers: "foo_bar" } } );
            Tag.findByIdAndDelete(req.params.id, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect("/entries");
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
        // Question: Is it better to do calculation on the server side or pass the entire entry body to the client and do the calculation there?
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
