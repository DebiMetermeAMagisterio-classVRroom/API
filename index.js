const http = require('http');
const crypto = require('crypto');
require('dotenv').config();
const express = require('express');
const bodyParser = require("body-parser");
const app = express()
const { MongoClient, ServerApiVersion } = require('mongodb');


const newLocal = 3001;
const PORT = process.env.PORT || newLocal;

const uri = process.env.DB_URI;
client= null;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var database, collection;


app.get('/api/get_courses', function (req, res) {
  collection.find().toArray((error, result) => {
    if(error) {
        res.send("Error")
    }
    res.json({
      message: "OK",
      response: result
    })
});
});

app.get('/api/login', function (req, res){
  var username = req.query.name;
  var password = req.query.password;
  collection = database.collection("users");
  collection.findOne({"first_name": username,"password":password}, (error,result)=>{
    if(username == "" && password == "") {
      res.json({
        status: "ERROR",
        message: "Authentication failed",
        session_token : ""
      })
    }else{
      var randNum = Math.floor(Math.random() * (1000 - 1 + 1) + 1);
      var tokenToHash = username+password+randNum;
      var token = crypto.createHash('sha256').update(tokenToHash).digest('hex');
      res.json({
        status: "OK",
        message: "Correct login, token created",
        session_token : token
      })
    }
  });
});

app.listen(PORT, () => {
  MongoClient.connect(uri, { useNewUrlParser: true, serverApi: ServerApiVersion.v1  }, (error, client) => {
    if(error) {
        throw error;
    }
    database = client.db(process.env.DB_NAME);
    collection = database.collection("courses");
    console.log("Connected to database" + "!");
  });
});