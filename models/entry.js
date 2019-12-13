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
        weather: String,
        aiData: {}
    }
});

module.exports = mongoose.model("Entry", entrySchema);