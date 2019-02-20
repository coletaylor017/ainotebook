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
    date: String,
    hidden: {
        type: Boolean,
        default: 0
    },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    metadata: {
        mood: String,
        weather: String,
        ri: {}
    }
});

module.exports = mongoose.model("Entry", entrySchema);