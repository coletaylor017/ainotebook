var mongoose = require("mongoose");

//mongoose schema setup
var entrySchema = new mongoose.Schema({
  tags: [
    String
  ],
  title: String,
  body: String,
  date: String,
  dateCreated: Date,
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
          locations: [ // should have called this "mentions". This sounds like a geographic location
            {
              confidence: String,
              location: [Number], // indicates beginning and end of the mention in the text. 
              // necessary because the exact text may vary in length
              text: String
            }
          ]
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
          locations: [Number] // all the indices of each time the keyword appears in the text. Calculated on entry submission
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
