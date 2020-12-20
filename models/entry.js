var mongoose = require("mongoose");

//mongoose schema setup
var entrySchema = new mongoose.Schema({
    tags: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tag"
        }
    ],
    body: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    metadata: {
        mood: String,
        containsNLUData: Boolean,
        nluData: {
            entities: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Entity"
                }
            ],
            concepts: [
                {
                    text: String,
                    relevance: Number,
                    infoURL: String
                }
            ],
            keywords: [
                {
                    text: String,
                    relevance: Number,
                    count: Number
                }
            ],
            sentiment: {
                score: Number,
                label: String
            },
            emotion: {
                sadness: Number,
                joy: Number,
                fear: Number,
                disgust: Number,
                anger: Number
            },
        }
    }
});

module.exports = mongoose.model("Entry", entrySchema);