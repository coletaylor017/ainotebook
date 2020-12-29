const Entry = require("../models/entry"),
  nlu = require("../helpers/nlu"),
  User = require("../models/user"),
  queries = require("../helpers/queries"),
  metadataQueries = require("../helpers/metadataQueries"),
  errorHandlers = require("../helpers/errorHandlers");

class EntriesController {

  static async allEntriesPage(req, res) {
    let tagsArr = [];

    let entryQuery = {
      "author.id": req.user._id,
    };

    // if the user has filtered by tag(s), search for entries with those tags
    if (req.query.tags) {
      tagsArr = req.query.tags.split(",");
      entryQuery.tags = { $all: tagsArr };
    }
    // if the user has entered a search term, search for entries containing that term
    if (req.query.keyword) {
      entryQuery["$text"] = { $search: req.query.keyword };
    }

    Entry.find(entryQuery, function (err, entries) {
      if (err) {
        errorHandlers.dbError(res, err);
      }
      // generate an object for each tag containing a name and a count of how many entries reference it
      Entry.aggregate(
        queries.getTagsWithCounts(req.user._id, tagsArr, req.query.keyword ? req.query.keyword : null),
        function (aggErr, tags) {
          if (aggErr) {
            errorHandlers.dbError(res, aggErr);
          }
          res.render("index", {
            queriedTags: tagsArr, // [String]
            tags: tags, // [{name: String, count: Number}]
            entries: entries.reverse(),
            keyword: req.query.keyword ? req.query.keyword : "",
          });
        }
      );
    });
  }

  static async entryShowPage(req, res) {
    Entry.findById(req.params.id).exec(function (err, entry) {
      if (err) {
        errorHandlers.dbError(res, err);
      }
      // get entity data
      const entityNames = entry.metadata.nluData.entities.map(e => e.name);
      Entry.aggregate(
        metadataQueries.getEntities(
          req.user._id,
          0.5,
          entityNames,
          null,
          null
          // new Date(Date.now() - 12096e5), // two weeks ago
          // new Date()
        ),
        function (aggErr, entities) {
          if (aggErr) {
            errorHandlers.dbError(res, aggErr);
          }
          res.render("show", {
            entry,
            entities
          });
        }
      )
    });
  }

  static async newEntryPage(req, res) {
    Entry.aggregate(queries.getTagNames(req.user._id), function (err, tags) {
      if (err) {
        errorHandlers.dbError(res, err);
      }
      res.render("new", { tags: tags });
    });
  }

  static async entryEditPage(req, res) {
    Entry.findById(req.params.id, function (err, entry) {
      if (err) {
        errorHandlers.dbError(res, err);
      }
      Entry.aggregate(queries.getTagNames(req.user._id), function (tagErr, tags) {
        if (tagErr) {
          errorHandlers.dbError(res, tagErr);
        }
        res.render("edit", { entry: entry, tags: tags });
      });
    });
  }

  static async createNewEntry(req, res) {
    const user = req.user;
    // trim the entry if it is all whtiespace
    if (req.body.entry.body.trim().length === 0) {
      req.flash("error", "Entry cannot be blank");
      res.redirect("back");
      return;
    }

    nlu
      .getNluData(req.body.entry.body.toLowerCase())
      .then(function (formattedData) {
        let entrySchemaData = {
          body: req.body.entry.body,
          dateCreated: new Date(), // current date & time
          author: {
            id: req.user._id,
            username: req.user.username,
          },
          metadata: {
            nluData: formattedData,
          },
        };

        Entry.create(entrySchemaData, function (err, entry) {
          if (err) {
            errorHandlers.dbError(res, err);
          }
          var streakDate = req.body.streakDate.split(",");
          var d1 = new Date(
            user.lastEntry[0],
            user.lastEntry[1],
            user.lastEntry[2]
          );
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

          if (diff == 0) {
            // if they've already submitted an entry today
            req.flash("success", "Entry submitted!");
          } else {
            if (user.streak > 1) {
              req.flash(
                "success",
                "Nice job! You've written for " +
                  user.streak +
                  " consecutive days. Come back tomorrow to keep the streak going!"
              );
            } else {
              req.flash(
                "success",
                "Nice job! Come back tomorrow to start building a streak!"
              );
            }
          }

          if (req.body.tags.length > 0) {
            let tags = JSON.parse(req.body.tags);
            let tagNames = tags.map((t) => t.value);

            Entry.findByIdAndUpdate(
              entry._id,
              { $addToSet: { tags: { $each: tagNames } } },
              function (tagErr) {
                if (tagErr) {
                  errorHandlers.dbError(res, tagErr);
                }
              }
            );
          }

          // regardless of the number of tags, show entry page when completed
          res.redirect("/entries/" + entry._id);
        });
      });
  }

  static async updateEntry(req, res) {
    if (req.body.entry.body.trim().length === 0) {
      // if entry is all whitespace
      req.flash("error", "Entry cannot be blank");
      res.redirect("back");
      return;
    }

    nlu
      .getNluData(req.body.entry.body.toLowerCase())
      .then(function (formattedData) {
        Entry.findByIdAndUpdate(
          req.params.id,
          {
            $set: {
              body: req.body.entry.body,
              tags:
                req.body.tags.length > 0
                  ? JSON.parse(req.body.tags).map((t) => t.value)
                  : [],
              metadata: { nluData: formattedData },
            },
          },
          function (err, entry) {
            if (err) {
              errorHandlers.dbError(res, err);
            }

            res.redirect("/entries/" + entry._id);
          }
        );
      })
      .catch(function (reason) {
        errorHandlers.dbError(res, reason);
      });
  }

  static async deleteEntry(req, res) {
    await User.findOneAndUpdate(
      { _id: req.user._id },
      { $pull: { entries: req.params.id } },
      function (err) {
        if (err) {
          errorHandlers.dbError(res, err); // returns
        }
      }
    );
    await Entry.findByIdAndDelete(req.params.id, function (err) {
      if (err) {
        errorHandlers.dbError(res, err); // returns
      }
    });
    res.redirect("/entries");
  }
}

module.exports = EntriesController;
