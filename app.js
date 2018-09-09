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

// Creating a convo between two people (Suppose the function recieves the info about the two people)
app.post("/talk", function(req, res) {
    var Sender, Reciever, newConversation;
    
    User.find( {"username": {$in: [req.body.username, req.user.username] } }, function(err, people) {
        Sender = people[1];
        Reciever = people[0];
        newConversation = { sender: Sender, reciever: Reciever, message: req.body.message, time: new Date().getHours()};
        Conversation.create(newConversation, function(err, newlyCreated) {
            User.findByIdAndUpdate(Reciever._id, {$push: {conversations: newlyCreated}}, {new: true}, function(err, updatedSender) {
                updatedSender.save();
            });
            User.findByIdAndUpdate(req.user._id, {$push: {conversations: newlyCreated}}, {new: true}, function(err, updatedSender) {
                updatedSender.save();
            });
        });
    });
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
        successRedirect: "/",
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