var express         = require("express"),
    app             = express(),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    Schema          = require("./models/Schema"),
    User            = mongoose.model('User'),
    Message         = mongoose.model('Message'),
    Conversation    = mongoose.model('Conversation');

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

// Connected a database
var url = "mongodb://localhost/socialite";
mongoose.connect(url);


app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   next();
});

// All the routes start here. Should be moved to a different file.

// The landing page route (entry route)
app.get("/", function(req, res) {
    res.render("landing");
});

app.get("/home", function(req, res) {
    res.render("home");
});

app.get("/talk", function(req, res) {
    var convo;
    var convoId = req.query.convo;
    User.findById(req.user._id).populate({path: 'conversations', populate : { path: 'participants'}}).exec(function(err, user) {
        if (err) {
            console.log(err);
        } else {
            if (convoId == undefined) {
                convo = user.conversations[0];
                
                // console.log("final convo is: "+ convoId + "\n" + convo);
                res.render("social/conversation", {user: user, conversation: convo});
                
            } else {
                Conversation.findById(convoId, function(err, conversation) {
                    if (err) {
                        console.log("error finding conversation");
                    } else {
                        convo = conversation;
                    }
                    // console.log("final convo is: "+ convoId + "\n" + convo);
                    res.render("social/conversation", {user: user, conversation: convo});
                });
            }
        }
    });
});

// This route handles messaging functionality.
app.post("/talk", function(req, res) {
    
    var sender, reciever, newMessage, newConversation;
    
    // find the sender and populate its conversations.
	User.findById(req.user._id).populate(["conversations"]).exec(function(err, Sender) { 
		sender = Sender;

		// find the reciever and populate its conversations.
        User.findById(req.query.id).populate(["conversations"]).exec(function(err, Reciever) {
            reciever = Reciever;
            
		    newMessage = { sender: sender, reciever: reciever, body: req.body.message, time: new Date()};

		    // Create a new message.
		    Message.create(newMessage, function(err, newlyCreatedMessage) {
		        newlyCreatedMessage.save();
		        if (err) {
		            console.log("mssg error " + err);
		        }
		        
		      //  console.log("New mssg is : \n" + newlyCreatedMessage + "\n<--------------------------->\n");

	            // check if there exists a conversation between the reciever and sender.
	            Conversation.find({participants: { $elemMatch: { _id: sender._id, _id: reciever._id  }}}, 
	            function(err, convo) {
	                if (err) {
	                    console.log("\n error is:" + err + "\n");
	                }
	                
	                
                    // convo is not in the records. Make a new convo and update database.
                    if (convo.length == 0) {
                        
                        // console.log("no convo found.\n")
                        
                        newConversation = { participants: [sender, reciever], time: new Date};
                        
                        Conversation.create(newConversation, function(err, newlyCreatedConversation) {
                            // newlyCreatedConversation.participants.push(sender);
                            // newlyCreatedConversation.participants.push(reciever);
                            newlyCreatedConversation.messages.push(newlyCreatedMessage);
                            newlyCreatedConversation.save();
                            
                            // console.log("new convo is: " + newlyCreatedConversation);
                            
                            if (err) {
                                console.log("\n error creating convo:" + err + "\n");
                            }

                            // update the sender and reciever.
                            User.findByIdAndUpdate(sender._id, {$push: {conversations: newlyCreatedConversation}}, {new: true}, function(err, updatedSender) {
                                updatedSender.save();

                                User.findByIdAndUpdate(reciever._id, {$push: {conversations: newlyCreatedConversation}}, {new: true}, function(err, updatedReciever) {
                                    updatedReciever.save();
                                });

                            });
                        });
                        
                    } else {
                        
                        // console.log("convo found.\n")
                        
                        // this should return a unique convo between the two users.
                        Conversation.findByIdAndUpdate(convo[0]._id, {$push: {messages: newlyCreatedMessage}}, {new: true}, function(err, updatedConversation) {
                            
                            // console.log("updated convo is: \n" + updatedConversation);
                            
                            updatedConversation.save();
                        });
                    }
	            });

		    });

        });

	});
    res.redirect("/talk");
});

// This is the page to add friends. this functionality will chnage it will be search based after completion.
app.get("/connect", function(req, res) {
    User.find({_id: { $ne: req.user._id }}, function(err, allUsers) {
        if (err) {
            console.log(err);
        } else {
            res.render("social/connect", {users: allUsers});    
        }
    });
});

// This route adds person A to person B and vice versa.
app.post("/connect/:UserID", function(req, res) {
    User.find( { _id : {$in: [req.params.UserID, req.user._id] } }, function(err, people) {
        var Sender = people[1];
        var Reciever = people[0];
        User.findByIdAndUpdate(Sender._id, {$push: {contacts: Reciever}} , {new: true}, function(err, updatedSender) {
                updatedSender.save();
        });
        User.findByIdAndUpdate(Reciever._id, {$push: {contacts: Sender}} , {new: true}, function(err, updatedSender) {
            updatedSender.save();
        });
        res.render("home");
    });
});

// The login page route and logic routes
app.get("/login", function(req, res) {
    res.render("login");
});

// This route handle the log in.
app.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/home",
        failureRedirect: "/login"
    }
));

// The sign up page route and logic routes
app.get("/register", function(req, res) {
    res.render("register");
});

app.post("/register", function(req, res) {
   var newUser = new User({username: req.body.username, contacts: [ ], conversations: [ ]});
   User.register(newUser, req.body.password, function(err, user) {
       if (err) {
           console.log(err);
           return res.render("register");
       }
       passport.authenticate("local")(req, res, function() { //this line will call the serializer and deserializer method of passport.
           res.redirect("/home");
       });
   });
});

// logout route
app.get("/logout", function(req, res){
   req.logout();
   res.redirect("/");
});


// This route gathers and prepares data to send forward to talk.
app.get("/:searching", function(req, res) {
// _parsedUrl.Url.query => fname=Henry
    var string = encodeURIComponent(req._parsedUrl.query.substring(6));
    res.redirect("/talk?convo="+string);
});


app.listen(process.env.PORT, process.env.IP, function() {
   console.log("The Socialite Server is live!");
});