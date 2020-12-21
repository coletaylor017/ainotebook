const express = require("express"),
  Entry = require("../models/entry"),
  Tag = require("../models/tag"),
  User = require("../models/user"),
  middleware = require("../middleware"),
  ridict = require("ridict"),
  mongoose = require("mongoose"),
  nluV1 = require("ibm-watson/natural-language-understanding/v1"),
  entriesController = require("../controllers/entriesController");

const router = express.Router();

const handleErr = (res, err) => {
  console.log("Now displaying error page with err: ", err);
  res.render("dbError", { err: err });
};

// https://stackoverflow.com/questions/1187518/how-to-get-the-difference-between-two-arrays-in-javascript
Array.prototype.diff = function (a) {
  return this.filter(function (i) {
    return a.indexOf(i) < 0;
  });
};

/**=============================================================
 * 'GET' ROUTES
 * =============================================================
 */

// index, or "All Entries Page"
router.get("/", middleware.isLoggedIn, function (req, res) {
  // generate an object for each tag containing a name and a count of how many entries reference it
  Entry.aggregate(
    [
      {
        $match: {
          "tags.0": {
            $exists: true,
          },
        },
      },
      {
        $unwind: {
          path: "$tags",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: "$tags",
          entryCount: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: false,
          name: "$_id",
          entryCount: true,
        },
      },
    ],
    function (aggErr, tags) {
      if (aggErr) {
        handleErr(res, aggErr);
      }

      let entryQuery;

      // if the user has entered a search term, search for entries containing that term
      if (!req.query.keyword) {
        entryQuery = { "author.id": req.user._id };
      } else {
        entryQuery = {
          "author.id": req.user._id,
          $text: { $search: req.query.keyword },
        };
      }

      Entry.find(entryQuery, function (err, entries) {
        if (err) {
          handleErr(res, err);
        }
        res.render("index", {
          tags: tags,
          entries: entries.reverse(),
          keyword: req.query.keyword ? req.query.keyword : "",
        });
      });
    }
  );
});

// entry creation page
router.get("/new", middleware.isLoggedIn, function (req, res) {
  Entry.aggregate(
    [
      {
        $match: {
          "tags.0": {
            $exists: true,
          },
        },
      },
      {
        $unwind: {
          path: "$tags",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: "$tags",
        },
      },
      {
        $project: {
          _id: false,
          name: "$_id",
          entryCount: true,
        },
      },
    ],
    function (err, tags) {
      if (err) {
        handleErr(res, err);
      }
      res.render("new", { tags: tags });
    }
  );
});

// entry show page
router.get("/:id", middleware.isLoggedIn, function (req, res) {
  Entry.findById(req.params.id).exec(function (err, entry) {
    if (err) {
      handleErr(res, err);
    }
    res.render("show", { entry: entry });
  });
});

// entry edit page
router.get("/:id/edit", middleware.isLoggedIn, function (req, res) {
  Entry.findById(req.params.id, function (err, entry) {
      if (err) {
        handleErr(res, err);
			}
			Entry.aggregate(
				[
				{
					$match: {
						"tags.0": {
							$exists: true,
						},
					},
				},
				{
					$unwind: {
						path: "$tags",
						preserveNullAndEmptyArrays: false,
					},
				},
				{
					$group: {
						_id: "$tags",
					},
				},
				{
					$project: {
						_id: false,
						name: "$_id",
						entryCount: true,
					},
				},
			], function(tagErr, tags) {
				if (tagErr) {
					handleErr(res, tagErr);
				}
				res.render("edit", { entry: entry, tags: tags });
			});
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
  entriesController.processNewEntry(req, res);
});

//update
router.put("/:id", middleware.isLoggedIn, function (req, res) {
	entriesController.updateEntry(req, res);
});

//destroy
router.delete("/:id", middleware.isLoggedIn, async function (req, res) {
  await User.findOneAndUpdate(
    { _id: req.user._id },
    { $pull: { entries: req.params.id } },
    function (err) {
      if (err) {
        handleErr(res, err); // returns
      }
    }
  );
  await Entry.findByIdAndDelete(req.params.id, function (err) {
    if (err) {
      handleErr(res, err); // returns
    }
  });
  res.redirect("/entries");
});

module.exports = router;
