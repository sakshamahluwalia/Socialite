var express         = require("express"),
    app             = express(),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    User            = require("./models/user"),
    Conversation    = require("./models/conversation");
    

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

app.get("/index", function(req, res) {
    res.render("home");
})

// this page shows the contact and the message to send.
app.get("/talk", function(req, res) {
    User.findById(req.user._id).populate(["contacts", "conversations"]).exec(function(err, user) {
        if (err) {
            console.log(err);
        } else {
            res.render("social/convo", {user: user});
        }
    });
});

app.post("/talk", function(req, res) {
    var sender, reciever, newConversation;

    // find the sender and populate its conversations.
    User.findById(req.user._id).populate(["conversations"]).exec(function(err, Sender) {
        sender = Sender;

        // find the reciever and populate its conversations.
        User.findById(req.body.id).populate(["conversations"]).exec(function(err, Reciever) {
            reciever = Reciever;

            // check if there exists a conversation between the reciever and sender.
            Conversation.find({ $or: 
                [   
                    {"reciever": reciever._id, "sender": sender._id},
                    {"sender": reciever._id, "reciever": sender._id}
                ]
            }, function(err, convo) {

                if (err) {
                    console.log("\n error is:" + err + "\n");
                } else {

                    // convo is not in the records. Make a new convo and update database.
                    if (convo.length == 0) {

                        newConversation = { sender: Sender, reciever: reciever, messages: [], time: new Date()};
                        newConversation.messages.push(req.body.message);
                        
                        Conversation.create(newConversation, function(err, newlyCreated) {

                            if (err) {
                                console.log("\n error creating convo:" + err + "\n");
                            }

                            // update the sender and reciever.
                            User.findByIdAndUpdate(sender._id, {$push: {conversations: newlyCreated}}, {new: true}, function(err, updatedSender) {
                                updatedSender.save();

                                User.findByIdAndUpdate(reciever._id, {$push: {conversations: newlyCreated}}, {new: true}, function(err, updatedReciever) {
                                    updatedReciever.save();
                                });

                            });
                        });
                    } else { 
                        // this should return a unique convo between the two users.
                        Conversation.findByIdAndUpdate(convo[0]._id, {$push: {messages: req.body.message}}, {new: true}, function(err, updatedConversation) {
                            updatedConversation.save();
                        });
                    }
                }
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
        res.render("landing");
    });
});



// The login page route and logic routes
app.get("/login", function(req, res) {
    res.render("login");
});

app.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/index",
        failureRedirect: "/login"
    }));

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
           res.redirect("/");
       });
   });
});

// logout route
app.get("/logout", function(req, res){
   req.logout();
   res.redirect("/");
});


app.listen(process.env.PORT, process.env.IP, function() {
   console.log("The Socialite Server is live!");
});

// todo
// Need to make a page to show prospectives and add logic to add Users in their contacts, Dont forget to remove the User from the Prospectives.
// Add a searchbar to add Users.
// dont show all the Users in the Add friends page.