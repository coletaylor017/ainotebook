const Entry = require("../models/entry"),
  nlu = require("../helpers/nlu"),
  User = require("../models/user"),
  queries = require("../helpers/queries");

class EntriesController {
  handleErr(res, err) {
    console.log("Now displaying DB error page with err: ", err);
    res.render("dbError", { err: err });
  }

  static async allEntriesPage(req, res) {
    // generate an object for each tag containing a name and a count of how many entries reference it
    Entry.aggregate(queries.getTagsWithCounts, function (aggErr, tags) {
      if (aggErr) {
        this.handleErr(res, aggErr);
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
          this.handleErr(res, err);
        }
        res.render("index", {
          tags: tags,
          entries: entries.reverse(),
          keyword: req.query.keyword ? req.query.keyword : "",
        });
      });
    });
  }

  static async entryShowPage(req, res) {
    Entry.findById(req.params.id).exec(function (err, entry) {
      if (err) {
        this.handleErr(res, err);
      }
      res.render("show", { entry: entry });
    });
  }

  static async newEntryPage(req, res) {
    Entry.aggregate(queries.getTagNames, function (err, tags) {
      if (err) {
        this.handleErr(res, err);
      }
      res.render("new", { tags: tags });
    });
  }

  static async entryEditPage(req, res) {
    Entry.findById(req.params.id, function (err, entry) {
      if (err) {
        this.handleErr(res, err);
      }
      Entry.aggregate(queries.getTagNames, function (tagErr, tags) {
        if (tagErr) {
          this.handleErr(res, tagErr);
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
          date: req.body.entry.date,
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
            this.handleErr(res, err);
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
                  this.handleErr(res, tagErr);
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
              this.handleErr(res, err);
            }

            res.redirect("/entries/" + entry._id);
          }
        );
      })
      .catch(function (reason) {
        this.handleErr(res, reason);
      });
  }

  static async deleteEntry(req, res) {
    await User.findOneAndUpdate(
      { _id: req.user._id },
      { $pull: { entries: req.params.id } },
      function (err) {
        if (err) {
          this.handleErr(res, err); // returns
        }
      }
    );
    await Entry.findByIdAndDelete(req.params.id, function (err) {
      if (err) {
        this.handleErr(res, err); // returns
      }
    });
    res.redirect("/entries");
  }
}

module.exports = EntriesController;
