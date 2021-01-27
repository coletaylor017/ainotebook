var mongoose = require("mongoose");

//mongoose schema setup
var quoteSchema = new mongoose.Schema({
    body: String,
    author: String,
    source: String,
    index: {
        type: Number,
        default: 0
    },
    uploader: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

module.exports = mongoose.model("Quote", quoteSchema);