var mongoose = require("mongoose");

var globalSchema = new mongoose.Schema({
    lastUpdate: {
        type: Date,
        default: Date.now
    },
    currentQuote: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quote"
    }
});

module.exports = mongoose.model("Global", globalSchema);