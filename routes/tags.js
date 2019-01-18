var express = require("express"),
    Entry   = require("../models/entry"),
    Tag     = require("../models/tag");

var router = express.Router();

// show
router.get("/:id", isLoggedIn, function(req, res) {
    Tag.findById(req.params.id).populate({ path: 'entries', populate: { path: 'tags', select: 'name' } }).exec(function(err, tag) {
        if (err) {
            console.log(err);
        } else {
            res.render("tag", {tag: tag, keyword: ""});
        }
    });
});

// destroy
router.delete("/:id", isLoggedIn, function(req, res) {
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

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

module.exports = router;