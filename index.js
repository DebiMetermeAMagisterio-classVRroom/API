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

var database, collection;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/api/get_courses', function (req, res) {
  collection = database.collection("courses");
  collection.find().toArray((error, result) => {
    if(error) {
        res.send("Error")
    }
    console.log(result)
    res.json({
      message: "OK",
      response: result
    })
});
});

app.get('/api/login', function (req, res){
  var username = req.query.username;
  var password = req.query.password;
  collection = database.collection("users");
  collection.findOne({"first_name":username,"password":password}, (error,result)=>{
    if(error){
      res.json({
        status: "ERROR",
        message: "Authentication failed",
        session_token : ""
      })
    }
    if(result) {
      var randNum = Math.floor(Math.random() * (1000 - 1 + 1) + 1);
      var tokenToHash = username+password+randNum;
      var token = crypto.createHash('sha256').update(tokenToHash).digest('hex');
      res.json({
        status: "OK",
        message: "Correct login, token created",
        session_token : token
      })
      collection.updateOne({"first_name":username,"password":password},{ $set:{"session_token":token}},function(err,res){
        if(err) throw err;
      })
    }else{
      res.json({
        status: "ERROR",
        query: req.body,
        message: "Authentication failed",
        session_token : ""
      })
    }
  });
});

app.get('/api/logout', function (req, res){
  var token = req.query.token;
  collection = database.collection("users");
  collection.findOne({"session_token":token}, (error,result)=>{
    if(error){
      res.json({
        status: "ERROR",
        message: "Session Token rquired"
      })
    }
    if(result){
      if(token == undefined || token == ""){
        res.json({
          status: "ERROR",
          message: "Session Token rquired"
        })
        }
        else{
          res.json({
            status: "OK",
            message: "Session succsesfully closed"
          })
      }
    }
    else{
        res.json({
          status: "ERROR",
          message: "Session Token rquired"
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
    console.log("Connected to database" + "!");
  });
});