const Entry = require("../models/entry"),
  Tag = require("../models/tag"),
  User = require("../models/user"),
  mongoose = require("mongoose"),
  nluV1 = require("ibm-watson/natural-language-understanding/v1"),
  { IamAuthenticator } = require("ibm-watson/auth");

const handleErr = (res, err) => {
  console.log("Now displaying error page with err: ", err);
  res.render("dbError", { err: err });
};

exports.processNewEntry = function (req, res) {
  const user = req.user;
  // trim the entry if it is all whtiespace
  if (req.body.entry.body.trim().length === 0) {
    res.flash("error", "Entry cannot be blank");
    res.redirect("back");
  }

	const authenticator = new IamAuthenticator({
		apikey: "A2aBQAYVj04Pp8jxP1aGUDXOhozhjJBDQ5IYDZqrcpmH",
	});
  const nlu = new nluV1({
    version: "2020-08-01",
    authenticator: authenticator,
    serviceUrl: process.env.WATSON_URL,
  });

  const analyzeParams = {
    text: req.body.entry.body,
    features: {
      entities: {
        sentiment: true,
        emotion: true,
      },
      keywords: {
        limit: 5,
      },
      concepts: {
        limit: 5,
			},
			sentiment: {},
			emotion: {},
    },
	};
	
	let entrySchemaData = null;

	nlu.analyze(analyzeParams)
	.then(function (returnedNLUData) {

		// if no error, print out response for debugging
		console.log(JSON.stringify(returnedNLUData, null, 4));

		entrySchemaData = {
			body: req.body.entry.body,
			date: req.body.entry.date,
			author: {
				id: req.user._id,
				username: req.user.username,
			},
			metadata: {
				containsNLUData: true,
				nluData: mapWatsonToSchema(returnedNLUData)
			}
		};

	})
	.catch(function(err) { // watson API error
		if (err.code == 422) {
			console.log(
				"Text analysis error: entry was too short for Watson analysis:"
			);
		} else if (err.code != null) {
			console.log("An unusual text analysis error occurred:");
		}
		console.log(err);
		// continue with entry processing regardless of NLU errors
		entrySchemaData = {
			body: req.body.entry.body,
			date: req.body.entry.date,
			author: {
				id: req.user._id,
				username: req.user.username,
			},
			metadata: {
				containsNLUData: false
			}
		};
	})
	.finally(function() {
		Entry.create(entrySchemaData, function (err, entry) {
			if (err) {
				handleErr(res, err);
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

			if (req.body.tags.length == 0) {
				// if there are no tags
				res.redirect("/entries/" + entry._id);
			} else {
				// otherwise, handle those tags
				var tags = JSON.parse(req.body.tags);
				let tagNames = tags.map((t) => t.value);

				// Select entry tags that already exist
				Tag.find(
					{ name: { $in: tagNames }, "user.id": req.user._id },
					{ name: 1, _id: 0 },
					function (err, existingTags) {
						if (err) {
							handleErr(res, err);
						}
						let existingTagNames = existingTags.map((t) => t.name);
						// Determine which tag names don't already exist so we can create those in a second
						var tagsToCreate = tagNames.diff(existingTagNames);

						var newTagArr = [];
						// create new mongodb-fiendly    objects for each new tag
						tagsToCreate.forEach(function (tName) {
							var oid = mongoose.Types.ObjectId();
							newTagArr.push({
								_id: oid,
								name: tName,
								user: {
									id: req.user._id,
									username: req.user.username,
								},
								entries: [],
							});
						});
						Tag.insertMany(newTagArr, function (err) {
							if (err) {
								handleErr(res, err);
							}
							var tagsToPush = existingTags.concat(newTagArr);
							addNewTags(req, res, entry, tagNames, tagsToPush);
						});
					}
				);
			}
			}
		);
	});	
};

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
        { name: { $in: allEntryTagNames }, "user.id": req.user._id },
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
};

const mapWatsonToSchema = (watsonData) =>
{
	return {

	};
}