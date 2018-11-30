var mongoose = require("mongoose");

//mongoose schema setup
var entrySchema = new mongoose.Schema({
    tags: String,
    metadata: String,
    body: String,
    date: {type: Date, default: Date.now},
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

module.exports = mongoose.model("Entry", entrySchema);