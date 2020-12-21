const Entry = require("../models/entry"),
  Tag = require("../models/tag"),
  User = require("../models/user"),
  mongoose = require("mongoose"),
  nluV1 = require("ibm-watson/natural-language-understanding/v1"),
  { IamAuthenticator } = require("ibm-watson/auth");

const handleErr = (res, err) => {
  console.log("Now displaying DB error page with err: ", err);
  res.render("dbError", { err: err });
};

exports.processNewEntry = function (req, res) {
  const user = req.user;
  // trim the entry if it is all whtiespace
  if (req.body.entry.body.trim().length === 0) {
    req.flash("error", "Entry cannot be blank");
    res.redirect("back");
    return;
  }

  getNluData(req.body.entry.body.toLowerCase()).then(function (formattedData) {
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

      if (req.body.tags.length > 0) {
        let tags = JSON.parse(req.body.tags);
        let tagNames = tags.map((t) => t.value);

        Entry.findByIdAndUpdate(
          entry._id,
          { $addToSet: { tags: { $each: tagNames } } },
          function (tagErr) {
            if (tagErr) {
              handleErr(res, tagErr);
            }
          }
        );
      }

      // regardless of the number of tags, show entry page when completed
      res.redirect("/entries/" + entry._id);
    });
  });
};

exports.updateEntry = function (req, res) {
  if (req.body.entry.body.trim().length === 0) {
    // if entry is all whitespace
    req.flash("error", "Entry cannot be blank");
    res.redirect("back");
    return;
  }

  getNluData(req.body.entry.body.toLowerCase()).then(function (formattedData) {
    Entry.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          body: req.body.entry.body,
          tags: req.body.tags.length > 0 ? JSON.parse(req.body.tags).map((t) => t.value) : [],
          metadata: { nluData: formattedData },
        },
      },
      function (err, entry) {
        if (err) {
          handleErr(res, err);
        }

        res.redirect("/entries/" + entry._id);
      }
    );
  })
  .catch(function(reason) {
    handleErr(res, reason);
  })
};

/**
 * Sends the given text to IBM's Natural Language Understanding service and translates the results into the approproate format for the nluData field on an entry.
 * If the entry is too short to analyze, or IBM returns some other error, returns null.
 * @param {The text to be analyzed by IBM Watson's NLU service} textToAnalyze
 */
const getNluData = function (textToAnalyze) {
  const authenticator = new IamAuthenticator({
    apikey: process.env.WATSON_API_KEY,
  });
  const nlu = new nluV1({
    version: "2020-08-01",
    authenticator: authenticator,
    serviceUrl: process.env.WATSON_URL,
    headers: {
      "X-Watson-Learning-Opt-Out": "true",
    },
  });

  const analyzeParams = {
    text: textToAnalyze,
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

  return nlu
    .analyze(analyzeParams)
    .then(function (returnedNluData) {
      console.log(JSON.stringify(returnedNluData));
      const data = returnedNluData.result;
      return {
        entities: data.entities.map(function (entity) {
          return {
            category: entity.type,
            name: entity.text,
            sentiment: {
              score: entity.sentiment.score,
              label: entity.sentiment.label,
            },
            relevance: entity.relevance,
            confidence: entity.confidence,
            emotion: {
              sadness: entity.emotion.sadness,
              joy: entity.emotion.joy,
              fear: entity.emotion.fear,
              disgust: entity.emotion.disgust,
              anger: entity.emotion.anger,
            },
            count: entity.count,
          };
        }),
        concepts: data.concepts.map(function (concept) {
          return {
            text: concept.text,
            relevance: concept.relevance,
            infoURL: concept.dbpedia_resource,
          };
        }),
        keywords: data.keywords.map(function (keyword) {
          return {
            text: keyword.text,
            relevance: keyword.relevance,
            count: keyword.count,
          };
        }),
        sentiment: {
          score: data.sentiment.document.score,
          label: data.sentiment.document.label,
        },
        emotion: {
          sadness: data.emotion.document.emotion.sadness,
          joy: data.emotion.document.emotion.joy,
          fear: data.emotion.document.emotion.fear,
          disgust: data.emotion.document.emotion.disgust,
          anger: data.emotion.document.emotion.anger,
        },
      };
    })
    .catch(function (err) {
      if (err.code != null && err.code != 422) {
        console.log("An unusual text analysis error occurred:");
        console.log(err);
      }
      return null;
    });
};
