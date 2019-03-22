var mongoose = require("mongoose");

//mongoose schema setup
var entrySchema = new mongoose.Schema({
    tags: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tag"
        }
    ],
    metadata: String,
    body: String,
    date: String,
    hidden: Boolean,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

module.exports = mongoose.model("Entry", entrySchema);