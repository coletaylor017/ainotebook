const   express    = require("express"),
        Entry      = require("../models/entry"),
        Tag        = require("../models/tag"),
        User       = require("../models/user"),
        middleware = require("../middleware"),
        ridict     = require("ridict"),
        mongoose   = require("mongoose"),
        nluV1        = require("ibm-watson/natural-language-understanding/v1");

const router = express.Router();
const nlu = new nluV1({
    version: "2019-07-12",
    // username: process.env.USERNAME,
    // password: process.env.PASSWORD,
    iam_apikey: process.env.WATSON_API_KEY,
    url: "https://gateway.watsonplatform.net/natural-language-understanding/api",
    headers: {
        "X-Watson-Learning-Opt-Out": "true"
    }
});

const analyzeParams = {
    text: "I really really love Cristina with all my heart. She is the best. However, I hate Nate. He's so obnoxious and just the worst, most awful person ever. Nate, nate nate. What a loser Nate is.",
    "features": {
        "entities": {
            "sentiment": true,
            "emotion": true
        }
    }
}

nlu.analyze(analyzeParams, function(err, body) {
    if (err) {
        console.log(err);
    } else {
        console.log(JSON.stringify(body, null, 4));
    }
})

//index
router.get("/", middleware.isLoggedIn, middleware.deleteDeadTags, function(req, res) {
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
            if (req.body.entry.body.length === 0) {
                res.redirect("/home");
            } else {
                Entry.create({
                    body: req.body.entry.body,
                    date: req.body.entry.date,
                    author: {
                        id: req.user._id,
                        username: req.user.username
                    },
                    metadata: {
                        ri: ridict.matches(req.body.entry.body)
                    }
                }, function(err, entry) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("new entry: ", entry);
                        
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
                            user.streak = 1;
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
                            res.redirect("/entries/" + entry._id)
                        } else {
                            var tags = JSON.parse(req.body.tags);
                            console.log("tags: ", tags);
                            var tagNames= [];
                            console.log("tags length: ", tags.length);
                            for (var i = 0; i < tags.length; i++) {
                                tagNames.push(tags[i].value);
                                console.log("value of item ", i, "of tags: ", tags[i].value);
                            }
                            console.log("tagNames: ", tagNames);
                            console.log("tags: ", tags);
                            Tag.find({ "name": { $in: tagNames }, "user.id": req.user._id }, function(err, oldTags) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log("oldTags: ", oldTags);
                                    var oldTagNames = [];
                                    for (var i = 0; i < oldTags.length; i++) {
                                        oldTagNames.push(oldTags[i].name);
                                        console.log("value of item ", i, "of oldTags: ", oldTags[i].name);
                                    }
                                    console.log("oldTagNames: ", oldTagNames);
                                    // https://stackoverflow.com/questions/1187518/how-to-get-the-difference-between-two-arrays-in-javascript
                                    Array.prototype.diff = function(a) {
                                        return this.filter(function(i) {return a.indexOf(i) < 0;});
                                    };
                                    var filtered = tagNames.diff(oldTagNames); 
                                    console.log("tagNames, filtered (filtered): ", filtered);
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
                                                                { "name": { $in: tagNames }, "user.id": req.user._id }, 
                                                                { $addToSet: { entries: entry } }, 
                                                                function(err, results2) {
                                                                    if (err) {
                                                                        console.log(err);
                                                                    } else {
                                                                        console.log("results of updateMany(): ", results2);
                                                                        res.redirect("/entries/" + entry._id);
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
        }
    });
});

//show
router.get("/:id", middleware.isLoggedIn, function(req, res) {
    Entry.findById(req.params.id).populate("tags", "name").exec(function(err, entry) {
        if (err) {
            console.log(err);
        } else {
            var rid = ridict.matches(entry.body);
            res.render("show", {entry: entry, rid: rid});
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
        console.log("entry length: ", req.body.entry.body.length)
        if (req.body.entry.body.length === 0) {
            entry.body = " "; //Having it completely empty breaks the metadata display page. Something to do with ridict
            entry.save(); //For some reason, MongoDB doesn't update the entry back to " " when user changes " " to "". This probably won't happen often if at all though.
            console.log("Running dat code");
        }
        if (err) {
            console.log(err);
        } else {
            if (req.body.tags.length === 0) {
                res.redirect("/entries");
            } else {
                console.log("req.body.tags: ", req.body.tags);
                var tags = JSON.parse(req.body.tags);
                console.log("tags: ", tags);
                var tagNames= [];
                console.log("tags length: ", tags.length);
                for (var i = 0; i < tags.length; i++) {
                    tagNames.push(tags[i].value);
                    console.log("value of item ", i, "of tags: ", tags[i].value);
                }
                console.log("tagNames: ", tagNames);
                
                console.log("ridict analysis: ", ridict.matches(entry.body));
                
                console.log("tags: ", tags);
                Tag.find({ "name": { $in: tagNames }, "user.id": req.user._id }, function(err, oldTags) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("oldTags: ", oldTags);
                        var oldTagNames = [];
                        for (var i = 0; i < oldTags.length; i++) {
                            oldTagNames.push(oldTags[i].name);
                            console.log("value of item ", i, "of oldTags: ", oldTags[i].name);
                        }
                        console.log("oldTagNames: ", oldTagNames);
                        // https://stackoverflow.com/questions/1187518/how-to-get-the-difference-between-two-arrays-in-javascript
                        Array.prototype.diff = function(a) {
                            return this.filter(function(i) {return a.indexOf(i) < 0;});
                        };

                        Tag.find( { "_id": { $in: entry.tags }, "user.id": req.user._id }, { name: 1, _id: 0 }, function(err, previousTags) {
                            if (err) {
                                console.log(err);
                            } else {

                                // Find all tags that must have this entry removed from their references
                                console.log("PREVIOUS TAGS: ", previousTags);

                                var previousTagNames = [];
                                for (var i = 0; i < previousTags.length; i++) {
                                    previousTagNames.push(previousTags[i].name);
                                    console.log("value of item ", i, "of previousTags: ", previousTags[i].name);
                                }
                                var tagsToUpdate = previousTagNames.diff(oldTagNames); 
                                console.log("TAGS TO UPDATE: ", tagsToUpdate);

                                Tag.updateMany( { name: { $in: previousTagNames } }, { $pull: { entries: entry._id } }, function(err) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        var filtered = tagNames.diff(oldTagNames);

                                        console.log("tagNames, filtered (filtered): ", filtered);
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
                                                                Tag.updateMany(
                                                                    { "name": { $in: tagNames }, "user.id": req.user._id }, 
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