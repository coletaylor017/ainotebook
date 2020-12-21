const Entry = require("../models/entry"),
  queries = require("../helpers/queries");

class TagsController {
  handleErr(res, err) {
    console.log("Now displaying DB error page with err: ", err);
    res.render("dbError", { err: err });
  }

  static async tagShowPage(req, res) {
    let entryQuery = {
      "author.id": req.user._id,
    };

    let tagsArr = [];

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
        this.handleErr(res, err);
      }
      // generate an object for each tag containing a name and a count of how many entries reference it
      Entry.aggregate(queries.getTagsWithCounts(tagsArr, req.query.keyword ? req.query.keyword : null), function (aggErr, tags) {
        if (aggErr) {
          this.handleErr(res, aggErr);
        }
        res.render("index", {
          tags: tags,
          entries: entries.reverse(),
          keyword: req.query.keyword ? req.query.keyword : "",
        });
      });
    });
  }

  static async deleteTag(req, res) {
    // tags are uniquely identified by their name
    Entry.updateMany(
      { tags: req.params.id },
      { $pull: { tags: req.params.id } },
      function (err) {
        if (err) {
          console.log(err);
        }
        res.redirect("/entries");
      }
    );
  }
}

module.exports = TagsController;
