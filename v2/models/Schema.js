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

var MessageSchema = new mongoose.Schema({
    sender: [UserSchema],
    reciever: [UserSchema],
    body: String,
    time: Date
});

var ConversationSchema = new mongoose.Schema({
    participants: [UserSchema],
    messages: [MessageSchema],
    time: Date
});

UserSchema.plugin(passportLocalMongoose);

module.exports =    mongoose.model('User', UserSchema), 
                    mongoose.model('Message', MessageSchema),
                    mongoose.model('Conversation', ConversationSchema);