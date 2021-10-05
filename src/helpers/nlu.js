const nluV1 = require("ibm-watson/natural-language-understanding/v1"),
  { IamAuthenticator } = require("ibm-watson/auth");

/**
 * Sends the given text to IBM's Natural Language Understanding service and translates the results into the approproate format for the nluData field on an entry.
 * If the entry is too short to analyze, or IBM returns some other error, returns null.
 * @param {The text to be analyzed by IBM Watson's NLU service} textToAnalyze
 */
exports.getNluData = function (textToAnalyze) {
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
        mentions: true,
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
            locations: entity.mentions.map(function(mention) {
              return {
                confidence: mention.confidence,
                location: mention.location,
                text: mention.text
              }
            })
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
          let hits = [];
          let currentHitIndex = 0;
          while(currentHitIndex = textToAnalyze.substring(currentHitIndex, textToAnalyze.length).search(keyword.text))
          {
            hits.push(currentHitIndex);
          }
          return {
            text: keyword.text,
            relevance: keyword.relevance,
            count: keyword.count,
            locations: hits
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
