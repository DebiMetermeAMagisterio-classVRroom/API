const http = require('http');
const crypto = require('crypto');
require('dotenv').config();
const express = require('express');
const bodyParser = require("body-parser");
const app = express()
const { MongoClient, ServerApiVersion } = require('mongodb');
var ObjectId = require('mongodb').ObjectId; 


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

app.get('/api/get_courses', function (req, res) {
  var token = req.query.token;
  collection = database.collection("users");
  collection.findOne({"session_token":token}, (error,result)=>{
    if(error) {
      res.json({
        status: "Error",
        message: "session_token is required"
      })
    }
    if(result){
      if(token=="" || token == undefined){
        res.json({
          status: "Error",
          message: "session_token is required"
        })
      }else{
        collection = database.collection("courses");
        collection.find({}).project({_id:1,title:1,description:1,subscribers:1}).toArray((error, result) => {
          if(error) {
            res.json({
              status: "Error",
              message: "session_token is required"
            })
          }
          if(result){
            res.json({
              status: "OK",
              message: "Connection succesfull,getting courses..",
              course_list: result
            })
          }
        });
      }      
    }
    else{
      res.json({
        status: "Error",
        message: "session_token is required"
      })
    }
  });
});

app.get('/api/get_course_details', function (req, res) {
  var token = req.query.token;
  var courseID = req.query.courseID;
  var userID;
  collection = database.collection("users");
  collection.findOne({"session_token":token}, (error,result)=>{
    if(error) {
      res.json({
        status: "Error",
        message: "session_token is required"
      })
    }
    if(result){
      if(token=="" || token == undefined){
        res.json({
          status: "Error",
          message: "session_token is required"
        })
      }else{
        userID=result.id;
        collection = database.collection("courses");
        collection.findOne({"_id":ObjectId(courseID)}, (error,result)=>{
          if(error) {
            res.json({
              status: "Error",
              message: "session_token is required"
            })
          }
          if(result){
            if(result.subscribers["students"].includes(userID)){
              res.json({
                status: "OK",
                message: "Connection succesfull,getting courses..",
                course_list: result
              })
            }else{
              res.json({
                status: "Error",
                message: "Student not subscribed to course selected"
              })
            }
          }
        });
      }      
    }
    else{
      res.json({
        status: "Error",
        message: "session_token is require"
      })
    }
  });
});

app.get('/api/export_database', function (req, res){
  var username = req.query.username;
  var password = req.query.password;
  collection = database.collection("users");
  collection.findOne({"first_name":username,"password":password}, (error,result)=>{
    if(error){
      res.json({
        status: "ERROR",
        message: "Database error"
      })
    }
    if(result) {
      collection = database.collection("courses");
      collection.find().toArray((error, result) =>{
        if(error){
          res.json({
            status: "ERROR",
            message: "Database error"
          })
        }
        if(result){
          res.json({
            status: "OK",
            message: "Exporting database...",
            course_list: result
          })
        }else{
          res.json({
            status: "ERROR",
            message: "Database error"
          })
        }
      })
    }else{
      res.json({
        status: "ERROR",
        message: "Database error"
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