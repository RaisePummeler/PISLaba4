const express = require("express");
const mongoClient = require("mongodb").MongoClient;
const objectId = require("mongodb").ObjectID;
const bodyParser = require("body-parser");
const app = express();

//jwt stuff
const jwt = require("jsonwebtoken");

//passport stuff
const passport = require("passport");
const jwtStrategry  = require("./jwt-strategy");
passport.use(jwtStrategry);

const url = "mongodb://localhost:27017/usersdb";

const jsonParser = bodyParser.json();
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get("/", (req, res) => {
    res.send("hello express server")
});
app.get("/users", jsonParser, (req, res) => {
    mongoClient.connect(url, function(err, client){
        client.db("usersdb").collection("auth").find({}).toArray(function(err, users){
            res.send(users)
            client.close();
        });
    });
});
app.get("/users/:id", jsonParser, function(req, res){    
    mongoClient.connect(url, function(err, client){
        client.db("usersdb").collection("auth").findOne({_id: objectId(req.params.id)}, function(err, user){
              
            if(err) return res.status(400).send();
              
            res.send(user);
            client.close();
        });
    });
});
app.post("/users/register", jsonParser, function (req, res) {
      
    if(!req.body) return res.sendStatus(400);
      
    let userName = req.body.name;
    let userAge = req.body.age;
    let login = req.body.login;
    let password = req.body.password;
    let user = {name: userName, age: userAge, login: login, password: password};
      
    mongoClient.connect(url, function(err, client){
        client.db("usersdb").collection("auth").insertOne(user, function(err, result){
              
            if(err) return res.status(400).send();
              
            res.send(user);
            client.close();
        });
    });
});
app.post("/login", jsonParser, (req, res) => {
    let { login, password } = req.body;
    //This lookup would normally be done using a database
    mongoClient.connect(url, function(err, client){
        client.db("usersdb").collection("auth").find({}).toArray(function(err, users){
            users.forEach(function(item, i, arr) {
                if (login === "paul@nanosoft.co.za") {
                    if (password === "pass") { //the password compare would normally be done using bcrypt.
                        const opts = {}
                        opts.expiresIn = 120;  //token expires in 2min
                        const secret 
                        = "SECRET_KEY" //normally stored in process.env.secret
                        const token = jwt.sign({ login }, secret, opts);
                        return res.status(200).json({
                            message: "Auth Passed",
                            token
                        });
                    }
                } else {
                    return res.status(401).json({ message: "Auth Failed" })
                }
                
            });

        });
    });
});

app.get("/protected", passport.authenticate('jwt', { session: false }), (req, res) => {
    return res.status(200).send("This is a protected Route")
});

let port = process.env.PORT || 3000; // for Azure
app.listen(3000);
