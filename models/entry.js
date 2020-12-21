var mongoose = require("mongoose");

//mongoose schema setup
var entrySchema = new mongoose.Schema({
  tags: [
    String
  ],
  body: String,
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    username: String,
  },
  metadata: {
    containsNLUData: Boolean,
    nluData: {
      entities: [
        {
          category: String,
          name: String,
          sentiment: {
            score: Number,
            label: String,
          },
          relevance: Number,
          confidence: Number,
          emotion: {
            sadness: Number,
            joy: Number,
            fear: Number,
            disgust: Number,
            anger: Number,
          },
          count: Number,
        },
      ],
      concepts: [
        {
          text: String,
          relevance: Number,
          infoURL: String,
        },
      ],
      keywords: [
        {
          text: String,
          relevance: Number,
          count: Number,
        },
      ],
      sentiment: {
        score: Number,
        label: String,
      },
      emotion: {
        sadness: Number,
        joy: Number,
        fear: Number,
        disgust: Number,
        anger: Number,
      },
    },
  },
});

module.exports = mongoose.model("Entry", entrySchema);
