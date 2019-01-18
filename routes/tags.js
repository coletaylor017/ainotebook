var express    = require("express"),
    Entry      = require("../models/entry"),
    Tag        = require("../models/tag"),
    middleware = require("../middleware");

var router = express.Router();

// show
router.get("/:id", middleware.isLoggedIn, function(req, res) {
    Tag.findById(req.params.id).populate({ path: 'entries', populate: { path: 'tags', select: 'name' } }).exec(function(err, tag) {
        if (err) {
            console.log(err);
        } else {
            res.render("tag", {tag: tag, keyword: ""});
        }
    });
});

// destroy
router.delete("/:id", middleware.isLoggedIn, function(req, res) {
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

module.exports = router;