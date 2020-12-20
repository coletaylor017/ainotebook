var mongoose = require("mongoose");

//mongoose schema setup
var entitySchema = new mongoose.Schema({
    entriesThatReference: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Entry"
        }
    ],
    type: String,
    name: String,
    overallSentiment: {
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
    totalMentions: Number,
    owner: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

module.exports = mongoose.model("Entity", entitySchema);