const express = require("express"),
    Entry = require("../models/entry"),
    Tag = require("../models/tag"),
    User = require("../models/user"),
    middleware = require("../middleware"),
    ridict = require("ridict"),
    mongoose = require("mongoose"),
    nluV1 = require("ibm-watson/natural-language-understanding/v1");

const router = express.Router();

const handleErr = (res, err) => {
    console.log("Now displaying error page with err: ", err);
    res.render("dbError", { err: err });
}

// https://stackoverflow.com/questions/1187518/how-to-get-the-difference-between-two-arrays-in-javascript
Array.prototype.diff = function (a) {
    return this.filter(function (i) { return a.indexOf(i) < 0; });
};

// initialize an object for dealing with Watson analysis
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

/**=============================================================
 * 'GET' ROUTES
 * =============================================================
 */

// index, or "All Entries Page"
router.get("/", middleware.isLoggedIn, middleware.deleteDeadTags /*put this on entry delete and tag delete routes */, function (req, res) {
    Tag.find({ "user.id": req.user._id }, function (err, tags) {
        if (err) {
            handleErr(err, res);
        }

        // I took out the "hidden" condition on refactor. Don't think I'm gonna use it anymore.
        if (!req.query.keyword) { //if no search query
            Entry.find({ "author.id": req.user._id })
                .populate("tags", "name") // Because we wanna display the tags and title
                .exec(function (err, entries) {
                    if (err) {
                        handleErr(err);
                    }
                    res.render("index", { tags: tags, entries: entries.reverse(), keyword: "" });
                });
        } else {
            Entry.find({ "author.id": req.user._id, $text: { $search: req.query.keyword } })
                .populate("tags", "name")
                .exec(function (err, entries) {
                    if (err) {
                        handleErr(err);
                    }
                    res.render("index", { tags: tags, entries: entries.reverse(), keyword: req.query.keyword });
                });
        }
    });
});

// entry creation page
router.get("/new", middleware.isLoggedIn, function (req, res) {
    Tag.find({ "user.id": req.user._id }, { name: 1, _id: 0 }, function (err, tags) {
        if (err) {
            handleErr(err);
        }
        let tagNames = tags.map((t) => t.name);
        res.render("new", { tags: tagNames });  // using es6 spread operator to get rid of a for loop
    });
});

// entry show page
router.get("/:id", middleware.isLoggedIn, function (req, res) {
    Entry.findById(req.params.id)
        .populate("tags", "name")
        .exec(function (err, entry) {
            if (err) {
                handleErr(err);
            }
            var metadata = entry.metadata;
            res.render("show", { entry: entry, metadata: metadata });
        });
});

// entry edit page
router.get("/:id/edit", middleware.isLoggedIn, function (req, res) {
    Entry.findById(req.params.id)
        .populate("tags", "name")
        .exec(function (err, entry) {
            if (err) {
                handleErr(err);
            }
            let tagNames = entry.tags.map((t) => t.name);
            res.render("edit", { entry: entry, tags: tagNames });
        });
});

/**=============================================================
 * 'POST' ROUTES
 * =============================================================
 */

// when "search" button clicked, this runs
router.post("/search", middleware.isLoggedIn, function (req, res) {
    res.redirect("/entries/" + "?keyword=" + req.body.searchterm);
});

// create new entry
router.post("/", middleware.isLoggedIn, function (req, res) {
    const user = req.user;
    // trim the entry if it is all whtiespace
    if (req.body.entry.body.trim().length === 0) {
        res.flash("error", "Entry cannot be blank");
        res.redirect("back");
    }
    const analyzeParams = {
        text: req.body.entry.body,
        "features": {
            "entities": {
                "sentiment": true,
                "emotion": true
            }
        }
    }

    nlu.analyze(analyzeParams, function (err, watsonResults) {
        if (err) {
            console.log(err);
        } else {
            console.log(JSON.stringify(watsonResults, null, 4));

            Entry.create({
                body: req.body.entry.body,
                date: req.body.entry.date,
                author: {
                    id: req.user._id,
                    username: req.user.username
                },
                metadata: {
                    aiData: watsonResults
                }
            }, function (err, entry) {
                if (err) {
                    handleErr(res, err);
                }
                var streakDate = req.body.streakDate.split(",");
                var d1 = new Date(user.lastEntry[0], user.lastEntry[1], user.lastEntry[2]);
                var d2 = new Date(streakDate[0], streakDate[1], streakDate[2]);
                var diff = d2 - d1;
                // convert ms to days
                diff = diff / 86400000;

                if (diff == 1 || user.streak == 0) {
                    user.streak++;
                } else if (diff > 1) {
                    user.streak = 1;
                }

                user.lastEntry = streakDate;
                // add the new entry to the user's list
                user.entries.push(entry);
                user.save();

                if (diff == 0) { // if they've already submitted an entry today
                    req.flash("success", "Entry submitted!");
                } else {
                    if (user.streak > 1) {
                        req.flash("success", "Nice job! You've written for " + user.streak + " consecutive days. Come back tomorrow to keep the streak going!");
                    } else {
                        req.flash("success", "Nice job! Come back tomorrow to start building a streak!");
                    }
                }

                if (req.body.tags.length == 0) { // if there are no tags
                    res.redirect("/entries/" + entry._id);
                }
                // otherwise, handle those tags
                var tags = JSON.parse(req.body.tags);
                let tagNames = tags.map((t) => t.value);

                // Find all tags that already exist so that we don't create duplicates
                Tag.find({ "name": { $in: tagNames }, "user.id": req.user._id }, function (err, existingTags) {
                    if (err) {
                        handleErr(res, err);
                    }
                    let existingTagNames = existingTags.map((t) => t.name);
                    // Determine which tag names don't already exist so we can create those in a second
                    var tagsToCreate = tagNames.diff(existingTagNames);

                    var newTagArr = [];
                    // create new mongodb-fiendly objects for each new tag
                    tagsToCreate.forEach(function (tName) {
                        var oid = mongoose.Types.ObjectId();
                        newTagArr.push({
                            _id: oid,
                            name: tName,
                            user: {
                                id: req.user._id,
                                username: req.user.username
                            },
                            entries: []
                        });
                    });
                    Tag.insertMany(newTagArr, function (err) {
                        if (err) {
                            handleErr(res, err);
                        }
                        var tagsToPush = existingTags.concat(newTagArr);
                        addNewTags(req, res, entry, tagNames, tagsToPush);
                    });
                });
            });
        }
    });
}
});

//update
router.put("/:id", middleware.isLoggedIn, function (req, res) {
    Entry.findByIdAndUpdate(req.params.id, req.body.entry, function (err, entry) {
        if (req.body.entry.body.trim().length === 0) { // if entry is all whitespace
            res.flash("error", "Entry cannot be blank");
            res.redirect("back");
        }
        if (err) {
            handleErr(res, err);
        }
        if (req.body.tags.length === 0) {
            res.redirect("/entries/" + entry._id)
        }
        var tags = JSON.parse(req.body.tags);
        let tagNames = tags.map((t) => t.value);

        Tag.find({ "name": { $in: tagNames }, "user.id": req.user._id }, function (err, oldTags) {
            if (err) {
                handleErr(res, err);
            }
            let oldTagNames = oldTags.map((t) => t.name);

            Tag.find({ "_id": { $in: entry.tags }, "user.id": req.user._id }, { name: 1, _id: 0 }, function (err, previousTags) {
                if (err) {
                    handleErr(res, err);
                }

                // Find all tags that must have this entry removed from their references
                let previousTagNames = previousTags.map((t) => t.name);
                // var tagsToUpdate = previousTagNames.diff(oldTagNames);

                Tag.updateMany({ name: { $in: previousTagNames } }, { $pull: { entries: entry._id } }, function (err) {
                    if (err) {
                        handleErr(res, err);
                    }
                    var filtered = tagNames.diff(oldTagNames);

                    var newTagArr = [];
                    // create new mongodb-fiendly objects for each new tag
                    filtered.forEach(function (tagVal) {
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
                    Tag.insertMany(newTagArr, function (err) {
                        if (err) {
                            handleErr(res, err);
                        }
                        var tagsToPush = oldTags.concat(newTagArr);
                        addNewTags(req, res, entry, tagNames, tagsToPush);
                    });
                });
            });
        });
    });
});

//destroy
router.delete("/:id", middleware.isLoggedIn, function (req, res) {
    User.findOneAndUpdate({ "_id": req.user._id }, { $pull: { entries: req.params.id } }, function (err) {
        if (err) {
            console.log(err);
        } else {
            // I would select only tags that reference the entry being deleted, but I'm lazy.
            // Maybe later if I'm looking for performance gains.
            Tag.updateMany({ "user.id": req.user._id }, { $pull: { entries: req.params.id } }, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    Entry.findByIdAndDelete(req.params.id, function (err) {
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

// Adds new tags to the newly created entry and adds the entry to all tags
const addNewTags = (req, res, entry, allEntryTagNames, newTags) => {
    // Add all new tags to the newly created entry
    Entry.findByIdAndUpdate(
        entry._id,
        { $addToSet: { tags: { $each: newTags } } },
        function (err) {
            if (err) {
                handleErr(res, err);
            }
            // Add this entry to all tags associated with it
            Tag.updateMany(
                { "name": { $in: allEntryTagNames }, "user.id": req.user._id },
                { $addToSet: { entries: entry } },
                function (err) {
                    if (err) {
                        handleErr(res, err);
                    }
                    res.redirect("/entries/" + entry._id);
                }
            );
        }
    );
}

module.exports = router;