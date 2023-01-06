require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require ("mongoose");
const bcrypt = require ("bcrypt");
const saltRounds = 10;


const app = express();

app.use (express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

mongoose.set('strictQuery', false); //deprecation warning
mongoose.connect('mongodb://127.0.0.1:27017/userDB', {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email:String,
    password:String
});

const User = new mongoose.model("User",userSchema);

app.get("/", function(req,res){
    res.render("home");
});

app.get("/login", function(req,res){
    res.render("login");
});

app.get("/register", function(req,res){
    res.render("register");
});

app.post("/register",function(req,res){
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        // Store hash in your password DB.
        const newUser = new User ({
            email: req.body.username,
            password: hash
        });
        newUser.save(function(err){
            if(err){
                console.log(err);
            }else{
                res.render("secrets");
            }
        });
    });

    
});

app.post ("/login",function(req,res){
    const username = req.body.username;
    const password = req.body.password;
    


User.findOne({email:username},function(err, foundUser){
    if(err){
        console.log(err);
    }else{
        if(foundUser){
            //se a password (que vem da const) for igual a foundUser.password
            bcrypt.compare(password, foundUser.password, function(err, result) {
                // result == true
                if (result === true){
                    res.render("secrets");
                }
            });
            
        }
    }
});
});

app.listen(3000,function() {
    console.log("Server started on port 3000");
});