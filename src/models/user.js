var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String,
    dateCreated: {
        type: Date,
        default: Date.now
    },
    streak: {
        type: Number,
        default: 0
    },
    lastEntry: [],
    badges: [],
    entries: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Entry"
        }
    ],
    isAdmin: {
        type: Boolean,
        default: 0
    },
    settings: {
        emails: {
            type: Boolean,
            default: 0
        },
        emailHour: String,
        emailMinute: String,
        background: {
            type: String,
            default: "mountains-bg-1.jpg"
        },
        theme: {
            type: String,
            default: "default"
        },
        dashboardConfig: {
            statDisplays: [
                {
                    // stat type can be "overview" (main overview card, takes no data, standard between users), "entities", "memories", or any number of
                    // other heretofore undecided standard card types. Order matters and affects the order in which they are displayed
                    dataDisplayType: String,

                    // the list of user's chosen entities to display, in the case of an entity data display
                    entities: [
                        {
                            name: String
                        }
                    ],
                    // starDate and endDate indicate the range of dates to display
                    startDate: Date,
                    endDate: Date
                }
            ]
        }
    },
    timezone: {
        type: Number,
        default: 0
    }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);