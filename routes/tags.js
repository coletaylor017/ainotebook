var express    = require("express"),
    middleware = require("../middleware"),
    TagsController = require("../controllers/TagsController");

var router = express.Router();

router.get("/:id", middleware.isLoggedIn, function(req, res) {
    TagsController.tagShowPage(req, res);
});

router.delete("/:id", middleware.isLoggedIn, function(req, res) {
    TagsController.deleteTag(req, res);
});

module.exports = router;