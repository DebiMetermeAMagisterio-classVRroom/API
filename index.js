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


app.get('/api/get_courses', function (req, res) {
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

app.get('/api/login/:name/:password', function (req, res){
  var name = req.params.name;
  var password = req.params.password
  collection = database.collection("users");
  collection.findOne({"first_name":name,"password":password}, (error,result)=>{
    if(error){
      res.json({
        status: "ERROR",
        message: "Authentication failed",
        session_token : ""
      })
    }
    if(result) {
      var randNum = Math.floor(Math.random() * (1000 - 1 + 1) + 1);
      var tokenToHash = name+password+randNum;
      var token = crypto.createHash('sha256').update(tokenToHash).digest('hex');
      res.json({
        status: "OK",
        message: "Correct login, token created",
        session_token : token
      })
    }else{
      res.json({
        status: "ERROR",
        message: "Authentication failed",
        session_token : ""
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