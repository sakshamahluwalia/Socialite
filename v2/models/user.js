var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    prospectives: 
    [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    contacts: 
    [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    conversations: 
    [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation"
        }
    ]
});

UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", UserSchema);