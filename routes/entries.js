var express    = require("express"),
    Entry      = require("../models/entry"),
    Tag        = require("../models/tag"),
    User       = require("../models/user"),
    middleware = require("../middleware"),
    ridict     = require("ridict"),
    mongoose   = require("mongoose");

var router = express.Router();


//index
router.get("/", middleware.isLoggedIn, function(req, res) {
    Tag.find({"user.id": req.user._id}, function(err, tags) {
        if (err) {
            console.log(err);
        } else {
            if (Object.keys(req.query).length === 0) { //if no search query
                Entry.find({"author.id": req.user._id, "hidden": 0}).populate("tags", "name").exec(function(err, entries) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.render("index", {tags: tags, entries: entries.reverse(), keyword: ""});
                    }
                });
            } else {
                Entry.find({"author.id": req.user._id, "hidden": 0, $text: { $search: req.query.keyword } }).populate("tags", "name").exec(function(err, entries) {
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

router.post("/search", function(req, res) {
    res.redirect("/entries/" + "?keyword=" + req.body.searchterm);
});

//new
router.get("/new", middleware.isLoggedIn, function(req, res) {
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
router.post("/", middleware.isLoggedIn, function(req, res) {
    console.log(req.body);
    User.findOne({username: req.user.username}, function(err, user) {
        if (err) {
            console.log(err);
        } else {
            Entry.create(req.body.entry, function(err, entry) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(req.body.entry);
                    entry.metadata = "";
                    entry.author.id = req.user._id;
                    entry.author.username = req.user.username;
                    if (req.body.hide === "on") { // could probably just do if (req.body.hide)
                        entry.hidden = 1;
                    } else {
                        entry.hidden = 0;
                    }
                    entry.save();
                    
                    console.log("last streak date: ", user.lastEntry);
                    var streakDate = req.body.streakDate.split(",");
                    console.log("Current streak date", streakDate);
                    
                    var d1 = new Date(user.lastEntry[0], user.lastEntry[1], user.lastEntry[2]);
                    var d2 = new Date(streakDate[0], streakDate[1], streakDate[2]);
                    console.log("ds: " + d1 + ", " + d2);
                    var diff = d2 - d1;
                    diff = diff/86400000;
                    console.log(diff);
                    if (diff === 1 || user.streak === 0) {
                        user.streak++;
                    } else if (diff > 1) {
                        user.streak = 0;
                    }
                        
                    user.lastEntry = streakDate;
                    user.entries.push(entry);
                    user.save();
                    console.log("req.body.tags: ", req.body.tags);
                    
                    if (diff === 0) { // if they've already submitted an entry today
                        req.flash("success", "Entry submitted!");
                    } else {
                        if (user.streak > 1) {
                            req.flash("success", "Nice job! You've written for " + user.streak + " consecutive days. Come back tomorrow to keep the streak going!");
                        } else {
                            req.flash("success", "Nice job! Come back tomorrow to start building a streak!");
                        }
                    }

                    
                    if (req.body.tags.length === 0 || req.body.hide === "on") {
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
router.get("/:id", middleware.isLoggedIn, function(req, res) {
    Entry.findById(req.params.id).populate("tags", "name").exec(function(err, entry) {
        if (err) {
            console.log(err);
        } else {
            res.render("show", {entry: entry});
        }
    });
});

//edit
router.get("/:id/edit", middleware.isLoggedIn, function(req, res) {
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
router.put("/:id", middleware.isLoggedIn, function(req, res) {
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
router.delete("/:id", middleware.isLoggedIn, function(req, res) {
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

module.exports = router;