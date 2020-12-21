const Entry = require("../models/entry"),
  queries = require("../helpers/queries");

class TagsController {
  handleErr(res, err) {
    console.log("Now displaying DB error page with err: ", err);
    res.render("dbError", { err: err });
  }

  static async tagShowPage(req, res) {
    res.render("tag", {tag: "static tag name", keyword: ""});
  }

  static async deleteTag(req, res) {
      // tags are uniquely identified by their name
    Entry.updateMany({ "tags": req.params.id }, { $pull: { tags: req.params.id } }, function(err) {
        if (err) {
            console.log(err);
        }
        
        res.redirect("/entries");
    });
  }
}

module.exports = TagsController;
